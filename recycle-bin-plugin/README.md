# Strapi 5 Recycle Bin Plugin (`strapi-plugin-recycle-bin`)

Safely intercept content deletions in **Strapi 5** with a soft-delete recycle bin, one-click document restore, and configurable retention auto-purge policies.

---

## ⚡ The Problem It Solves

In Strapi 5, when an editor deletes an entry in the Content Manager, it is immediately and permanently purged from the database. Accidental deletions happen often in editorial teams, and until now the only recovery option was restoring a raw database backup.

This plugin provides a safety net:
1. **Intercepts Deletion**: A Document Service middleware archives deleted documents and relations into a secure recycle bin snapshot before deletion.
2. **Strapi Admin UI**: An intuitive "Recycle Bin" interface in the Strapi Admin sidebar where editors can search, view, restore, or permanently purge items.
3. **Draft & Published Aware**: Restores records back into their original content type seamlessly.
4. **Automatic Retention Cron**: Configurable background cron that auto-purges items older than your retention limit (default: 30 days).

---

## 📦 Installation

In your Strapi 5 project root:

```bash
# Using npm
npm install strapi-plugin-recycle-bin

# Using yarn
yarn add strapi-plugin-recycle-bin
```

---

## ⚙️ Configuration

Enable and configure the plugin in `config/plugins.ts` (or `config/plugins.js`):

```typescript
export default ({ env }) => ({
  'recycle-bin': {
    enabled: true,
    config: {
      retentionDays: 30, // Number of days to keep deleted items before automatic purge
      excludedUids: [    // Content types to bypass (not captured into recycle bin)
        'admin::user',
        'admin::permission',
        'admin::role',
        'admin::api-token',
        'admin::transfer-token',
        'plugin::recycle-bin.recycle-bin-item',
        'plugin::upload.file',
      ],
    },
  },
});
```

---

## 🚀 How It Works

- **Archive Action**: Whenever `strapi.documents(uid).delete(...)` is called, the deletion middleware captures the document snapshot, record metadata, and the deleting user context.
- **Restore Action**: Clicking **Restore** re-instantiates the document through the Strapi Document Service API, preserving draft/published state, and deletes the recycle bin entry.
- **Permanent Purge**: Clicking **Purge** immediately removes the snapshot from the recycle bin table.
- **Auto-Purge**: Runs every night at midnight (`0 0 * * *`) to delete expired items older than `retentionDays`.

---

## 🛡️ Security & Permissions

- All Recycle Bin management endpoints (`/recycle-bin/items`) require authenticated admin privileges (`admin::isAuthenticatedAdmin`).
- Recycle bin entries are hidden from the standard Content Manager and Content-Type Builder to prevent tampering.

---

## 📄 License

MIT © [Kaushik Patil](mailto:kaushik.patil@gigasolv.com)