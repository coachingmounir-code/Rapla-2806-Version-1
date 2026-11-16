(function (root) {
  'use strict';
  // Separate append-only operations prevent unrelated edits, deletions and unchecked
  // tasks from being overwritten by the legacy whole-planner merge.
  const PREFIX = 'zeitflow_seva_v1:';
  const SHARED_BRIDGE_ID = 'zeitflow-seva-k-shared-v1';
  function notifyOpsChanged() {
    if (typeof root.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      try { root.dispatchEvent(new CustomEvent('seva-operations-changed')); } catch (_) {}
      try {
        if (root.parent && root.parent !== root) {
          root.parent.dispatchEvent(new CustomEvent('seva-operations-changed'));
        }
      } catch (_) {}
    }
  }
  class Store {
    constructor(storage = localStorage) {
      this.storage = storage;
      const last = storage.getItem(PREFIX + 'active-account') || 'local';
      this.scope = /^(team|pending):/.test(last) ? 'local' : last;
    }
    key(scope = this.scope) { return PREFIX + scope + ':op:'; }
    operations(scope = this.scope) {
      const result = [], prefix = this.key(scope);
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(prefix)) result.push(SevaModel.validate(JSON.parse(this.storage.getItem(key))));
      }
      return result;
    }
    put(op, scope = this.scope) {
      SevaModel.validate(op);
      this.storage.setItem(PREFIX + scope + ':op:' + op.id, JSON.stringify(op));
      notifyOpsChanged();
    }
    change(kind, entityId, patch) {
      const max = this.operations().reduce((n, op) => Math.max(n, op.time), 0);
      const op = { id: crypto.randomUUID(), entityId, kind, time: Math.max(Date.now(), max + 1), patch };
      this.put(op); return op;
    }
    entities() { return SevaModel.materialize(this.operations()); }
  }
  class Cloud {
    constructor(store, onChange, onStatus, onAccount) {
      this.store = store; this.onChange = onChange; this.onStatus = onStatus; this.onAccount = onAccount;
      this.accountInitialized = false; this.user = null; this.running = false; this.again = false; this.client = null;
      const fromLink = new URLSearchParams(location.search).get('team');
      const pending = store.storage.getItem(PREFIX + 'pending-team');
      store.storage.removeItem(PREFIX + 'pending-team');
      const candidate = fromLink || pending;
      this.teamId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate || '') ? candidate : null;
      this.workspaceId = null; this.authorized = false; this.checking = false; this.accessError = false;
    }
    sharedSyncEnabled() {
      return Boolean(root.SEVA_CLOUD?.url && this.client && !this.teamId);
    }
    async init() {
      if (!root.supabase || !root.SEVA_CLOUD) { this.onStatus('Nur auf diesem Gerät gespeichert'); return; }
      const { url, key } = root.SEVA_CLOUD;
      this.client = root.supabase.createClient(url, key, { auth: { storageKey: 'zeitflow_seva_auth_v1', detectSessionInUrl: true } });
      this.client.auth.onAuthStateChange((event, session) => {
        // Do not await Supabase methods inside the auth callback (auth lock).
        if (!session && event !== 'SIGNED_OUT' && !navigator.onLine) return;
        setTimeout(() => this.account(session?.user || null), 0);
      });
      root.addEventListener('online', () => this.resume());
      root.addEventListener('focus', () => this.resume());
      root.addEventListener('pageshow', () => this.resume());
      root.addEventListener('offline', () => this.onStatus('Offline · Änderungen bleiben auf diesem Gerät'));
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.resume(); });
      this.timer = setInterval(() => { if (!document.hidden && !this.running) this.sync(); }, 3000);
      await this.resume();
    }
    async resume() {
      try {
        const { data, error } = await this.client.auth.getSession();
        if (error) throw error;
        if (!data.session && !navigator.onLine) { this.account(null); this.onStatus('Offline · gespeicherter Bestand auf diesem Gerät'); return; }
        this.account(data.session?.user || null);
      } catch (_) {
        if (this.sharedSyncEnabled() && navigator.onLine) {
          this.account(null);
        } else {
          this.onStatus('Anmeldung vorübergehend nicht prüfbar · lokal gespeichert');
        }
      }
    }
    account(user) {
      if (this.accountInitialized && this.user?.id === user?.id && (this.checking || this.authorized || (!user && this.sharedSyncEnabled()))) {
        if (this.authorized || (!user && this.sharedSyncEnabled())) return this.sync();
        return;
      }
      this.accountInitialized = true;
      this.user = user;
      this.authorized = false;
      this.accessError = false;
      this.checking = !!(user && this.teamId && this.teamId !== user.id);
      this.workspaceId = null;
      this.store.scope = user && this.teamId ? 'pending:' + this.teamId + ':' + user.id : user ? user.id : 'local';
      this.store.storage.setItem(PREFIX + 'active-account', this.store.scope);
      this.onAccount(user); this.onChange();
      if (!user) {
        if (this.sharedSyncEnabled()) {
          this.sync();
          return;
        }
        this.onStatus(this.teamId ? 'Für die Teamliste anmelden' : 'Nur auf diesem Gerät · für Geräteabgleich anmelden');
        return;
      }
      if (!this.teamId || this.teamId === user.id) {
        this.workspaceId = user.id; this.authorized = true; this.store.scope = user.id;
        this.store.storage.setItem(PREFIX + 'active-account', this.store.scope);
        // Adopt any local operations into the authenticated scope so nothing created before sign-in is lost
        try {
          const localOps = this.store.operations('local');
          const userIds = new Set(this.store.operations(user.id).map(op => op.id));
          for (const op of localOps) if (!userIds.has(op.id)) this.store.put(op, user.id);
        } catch (_) {}
        this.onAccount(user); this.onChange(); this.sync(); return;
      }
      this.onStatus('Teamzugriff wird geprüft …');
      this.client.rpc('seva_join_team', { p_owner_id: this.teamId }).then(({ data, error }) => {
        if (this.user?.id !== user.id) return;
        this.checking = false;
        if (error || !data) {
          this.accessError = !!error;
          this.onStatus(error ? 'Teamzugriff derzeit nicht prüfbar' : 'Kein Zugriff auf diese Teamliste');
          this.onAccount(user); return;
        }
        this.workspaceId = this.teamId; this.authorized = true;
        this.store.scope = 'team:' + this.teamId + ':' + user.id;
        this.store.storage.setItem(PREFIX + 'active-account', this.store.scope);
        this.onAccount(user); this.onChange(); this.sync();
      }).catch(() => {
        if (this.user?.id !== user.id) return;
        this.checking = false; this.accessError = true;
        this.onStatus('Teamzugriff derzeit nicht prüfbar'); this.onAccount(user);
      });
    }
    async login(email) {
      if (!this.client) throw Error('Verbindung noch nicht verfügbar. Bitte erneut öffnen.');
      if (this.teamId) this.store.storage.setItem(PREFIX + 'pending-team', this.teamId);
      const redirectPath = location.pathname.startsWith('/admin-todos') || location.pathname.startsWith('/digital-shiva') ? location.pathname : '/seva/';
      const { error } = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: new URL(redirectPath, location.origin).href } });
      if (error && this.teamId) this.store.storage.removeItem(PREFIX + 'pending-team');
      if (error) throw error;
    }
    async verifyLoginLink(rawInput) {
      if (!this.client) throw Error('Verbindung noch nicht verfügbar.');
      const input = String(rawInput || '').trim();
      if (!input) throw Error('Bitte den Anmeldelink oder Code einfügen.');
      // 1. Check for #access_token=...&refresh_token=...
      if (input.includes('access_token=') && input.includes('refresh_token=')) {
        const hashPart = input.includes('#') ? input.slice(input.indexOf('#') + 1) : input.includes('?') ? input.slice(input.indexOf('?') + 1) : input;
        const params = new URLSearchParams(hashPart);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          const { data, error } = await this.client.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          this.account(data.session?.user || null);
          return;
        }
      }
      // 2. Check for ?token=... or token_hash=... in Supabase verify URL
      if (input.includes('token=') || input.includes('token_hash=')) {
        const queryPart = input.includes('?') ? input.slice(input.indexOf('?') + 1).split('#')[0] : input;
        const params = new URLSearchParams(queryPart);
        const token_hash = params.get('token_hash') || params.get('token');
        const type = params.get('type') || 'magiclink';
        if (token_hash) {
          const { data, error } = await this.client.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
          this.account(data.session?.user || null);
          return;
        }
      }
      throw Error('Der eingefügte Link konnte nicht erkannt werden. Bitte kopiere den kompletten Link aus der E-Mail.');
    }
    async logout() {
      const { error } = await this.client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
    async sync() {
      const canAuthSync = Boolean(this.user && this.client && this.authorized);
      const canSharedSync = this.sharedSyncEnabled();
      if (!canAuthSync && !canSharedSync) return;
      if (!navigator.onLine) { this.onStatus('Offline · Änderungen bleiben auf diesem Gerät'); return; }
      if (this.running) { this.again = true; return; }
      this.running = true; this.again = false;
      const owner = this.workspaceId, account = this.user?.id || null, scope = this.store.scope;
      try {
        this.onStatus('Geräte werden abgeglichen …');
        if (canAuthSync && this.teamId && owner !== account) {
          const { data, error } = await this.client.rpc('seva_join_team', { p_owner_id: owner });
          if (error) throw error;
          if (!data) {
            this.authorized = false; this.workspaceId = null; this.accessError = false;
            for (let i = this.store.storage.length - 1; i >= 0; i--) {
              const key = this.store.storage.key(i);
              if (key?.startsWith(PREFIX + scope + ':op:')) this.store.storage.removeItem(key);
            }
            this.store.scope = 'pending:' + owner + ':' + account;
            this.onAccount(this.user); this.onChange();
            this.onStatus('Teamzugriff entfernt'); return;
          }
        }
        const localIds = new Set(this.store.operations(scope).map(op => op.id));
        let changed = false;

        // 1. Authenticated sync with seva_task_operations
        const known = new Set();
        if (canAuthSync) {
          const remote = [], pageSize = 500;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await this.client.from('seva_task_operations').select('id, operation').eq('owner_id', owner).order('id').range(offset, offset + pageSize - 1);
            if (error) throw error;
            remote.push(...data);
            if (data.length < pageSize) break;
          }
          if ((this.user?.id || null) !== account || this.workspaceId !== owner) return;
          for (const row of remote) {
            known.add(row.id);
            if (!localIds.has(row.id)) {
              this.store.put(row.operation, scope);
              localIds.add(row.id);
              changed = true;
            }
          }
        }

        // 2. Shared Cross-App Sync Bridge (user_planner_data -> zeitflow-seva-k-shared-v1)
        const sharedKnownIds = new Set();
        const sharedOps = [];
        if (canSharedSync) {
          try {
            const { data: sharedRows, error: sharedFetchErr } = await this.client
              .from('user_planner_data')
              .select('data')
              .eq('user_id', SHARED_BRIDGE_ID)
              .limit(1);
            if (!sharedFetchErr && Array.isArray(sharedRows) && Array.isArray(sharedRows[0]?.data?.operations)) {
              for (const rawOp of sharedRows[0].data.operations) {
                try {
                  const validOp = SevaModel.validate(rawOp);
                  sharedKnownIds.add(validOp.id);
                  sharedOps.push(validOp);
                  if (!localIds.has(validOp.id)) {
                    this.store.put(validOp, scope);
                    localIds.add(validOp.id);
                    changed = true;
                  }
                } catch (_) {}
              }
            }
          } catch (_) {}
        }

        // Render downloaded changes even when the following upload fails.
        // Unchanged polling must not rebuild cards or interrupt keyboard focus.
        if (changed) {
          this.onChange();
          notifyOpsChanged();
        }

        const currentOps = this.store.operations(scope);

        // 3. Upload pending operations to seva_task_operations (when authenticated)
        if (canAuthSync) {
          const pending = currentOps.filter(op => !known.has(op.id));
          for (let i = 0; i < pending.length; i += 100) {
            if ((this.user?.id || null) !== account || this.workspaceId !== owner) return;
            const rows = pending.slice(i, i + 100).map(operation => ({ id: operation.id, owner_id: owner, operation }));
            const { error } = await this.client.from('seva_task_operations').upsert(rows, { onConflict: 'owner_id,id', ignoreDuplicates: true });
            if (error) throw error;
          }
          for (const op of pending) known.add(op.id);
        }

        // 4. Upload merged operations to Shared Cross-App Sync Bridge
        if (canSharedSync) {
          const hasUnshared = currentOps.some(op => !sharedKnownIds.has(op.id));
          if (hasUnshared) {
            const mergedMap = new Map();
            for (const op of sharedOps) mergedMap.set(op.id, op);
            for (const op of currentOps) mergedMap.set(op.id, op);
            const mergedOps = [...mergedMap.values()].sort(SevaModel.compare);
            const { error: sharedUpsertErr } = await this.client
              .from('user_planner_data')
              .upsert({
                user_id: SHARED_BRIDGE_ID,
                data: { format: 'zeitflow-seva', version: 1, operations: mergedOps },
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
            if (sharedUpsertErr && !canAuthSync) throw sharedUpsertErr;
            if (!sharedUpsertErr) {
              for (const op of mergedOps) sharedKnownIds.add(op.id);
            }
          }
        }

        if ((this.user?.id || null) !== account || this.workspaceId !== owner) return;
        const latestOps = this.store.operations(scope);
        if (canAuthSync) {
          this.again = this.again || latestOps.some(op => !known.has(op.id));
        } else if (canSharedSync) {
          this.again = this.again || latestOps.some(op => !sharedKnownIds.has(op.id));
        }
        this.onStatus(this.again ? 'Weitere Änderungen werden abgeglichen …' : 'Abgeglichen · ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        console.warn('SEVA sync:', error.message);
        if ((this.user?.id || null) === account) this.onStatus('Geräteabgleich ausstehend · lokal gespeichert. Erneut versuchen.');
      } finally {
        this.running = false;
        if (this.again) { this.again = false; setTimeout(() => this.sync(), 1000); }
      }
    }
    teamLink() { return new URL('/seva/?team=' + this.user.id, location.origin).href; }
    async invite(email) {
      if (!this.authorized || this.workspaceId !== this.user?.id) throw Error('Nur die Listeninhaberin oder der Listeninhaber kann Teamzugänge vergeben.');
      const normalized = email.trim().toLowerCase();
      const { error } = await this.client.from('seva_team_access').insert({ owner_id: this.user.id, email: normalized });
      if (error) throw error;
    }
    async teamMembers() {
      if (!this.authorized || this.workspaceId !== this.user?.id) return [];
      const { data, error } = await this.client.from('seva_team_access').select('email, member_id').eq('owner_id', this.user.id).order('email');
      if (error) throw error;
      return data;
    }
    async revoke(email) {
      if (!this.authorized || this.workspaceId !== this.user?.id) throw Error('Kein Recht zum Entfernen.');
      const { error } = await this.client.from('seva_team_access').delete().eq('owner_id', this.user.id).eq('email', email);
      if (error) throw error;
    }
  }
  root.SevaStore = Store; root.SevaCloud = Cloud;
})(window);
