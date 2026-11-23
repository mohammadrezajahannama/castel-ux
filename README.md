# Castel UX

The UX testing platform of Castel. It runs on GitHub Pages, with no server.

- `/` – the landing page (`site/index.html`)
- `/t/<test-id>/` – a test page (`site/t/<test-id>/index.html`). Tests are plain HTML; they share `site/shared/`.
- `/admin/` – the admin panel: the React app in `src/` (based on [admin-craft](https://github.com/amirking59/admin-craft)).

## How a result travels

1. The tester takes the test. The page records the task (screens, clicks for the heatmap, times) and the answers.
2. At the end, the page packs the result into a code (`CASTEL1…`), encrypts it with the admin's public key, and posts it
   as an issue in the private repo `castel-ux-results` (`site/shared/ux-submit.js`). Nothing more is asked of the tester.
3. A result that can't be sent waits in the tester's browser, and every later visit to the site sends it. If sending
   fails three times, the page also offers the result as a file or a code (`site/shared/ux-delivery.js`).
4. The admin panel reads the issues and opens them with the admin's private key, which stays in the admin's browser.
   Results sent by hand are added with "Add from file".

### Settings

- Repo secret `UX_SUBMIT_TOKEN`: a fine-grained token with Issues read and write on `castel-ux-results` only. The build
  writes it into the site (`_site/shared/submit-token.js`); it is never committed. It can only post and read
  encrypted results.
- `site/shared/config.js`: `UX_PUBLIC_KEY` (the admin's public key, from the panel's key page), `UX_RESULTS_REPO`,
  and `UX_CONTACT` (the admin's Bale ID, shown when a tester must send a file).
- The private key is created once on the panel's login page, which downloads a backup file. Without that file, results
  sent with its public key can't be read.

## Adding a test

1. Add `site/t/<test-id>/index.html`. Load `../../shared/fonts.css`, `../../shared/config.js` and `../../shared/ux-delivery.js`.
2. Also load `../../shared/submit-token.js` and `../../shared/ux-submit.js`. Put `test: '<test-id>'` in the result.
   At the end, `await UXSubmit.submit({ code, testId, runId })`; if it returns false, `UXDeliver.render(element, …)`.
3. Add a card for it in `site/index.html`.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`: `scripts/build-site.sh` builds the panel under
`/<repo>/admin/`, copies `site/` beside it, and GitHub Pages serves `_site/`. In the repo's Settings → Pages,
Source must be "GitHub Actions".

## Getting started

```bash
yarn install
yarn dev                      # the admin panel at http://localhost:3000 (results need the deployed token)
./scripts/build-site.sh       # the whole site in _site/
```

## Scripts

- `yarn dev` – dev server
- `yarn build` – the admin panel only (`dist/client` holds the static app; `_shell.html` is the SPA entry)
- `yarn start` – preview the production build
- `yarn typecheck`, `yarn lint` (oxlint), `yarn format` / `yarn format:check` (oxfmt)

## Deploying

The build is a static SPA. Serve `dist/client` and rewrite unknown paths to `/_shell.html`, e.g. Netlify `_redirects`:

```
/* /_shell.html 200
```

## Structure

- `src/routes` – file-based routes (thin; import from features)
- `src/features/<feature>` – feature components, services and types
- `src/components` – shared components (`ui/` is shadcn, `form/` are TanStack Form field components)
- `messages/{en,ar,fa}.json` and `project.inlang/` – the texts, compiled into `src/paraglide` (generated, not committed)

## Languages

- Use a text with `m.some_key()` from `@/paraglide/messages.js`. Keys are snake_case; feature texts start with the feature's name (`orders_title`).
- English is the default. The language picked in the user menu is stored in `localStorage`, and switching reloads the page: Paraglide's messages aren't reactive, so a reload is what updates every text and the page direction together.
- Arabic and Persian are right-to-left. `<html dir>` and the sidebar's side follow `getTextDirection()`, and styles use logical classes (`ms-*`, `pe-*`, `start-*`), never `ml-*`/`right-*`.
- Zod's validation messages follow the language too (`z.config` in `src/routes/__root.tsx`).
- To add a language, add its code to `project.inlang/settings.json`, add `messages/<code>.json`, and give it a label in `src/components/app-sidebar/nav-user/locale-select.tsx`.

## Data tables

`DataTable` keeps the page, sort and filters in the URL, so a filtered, sorted page can be shared as a link. Its route validates them:

```ts
export const Route = createFileRoute("/_main/orders")({
  validateSearch: dataTableSearchSchema,
  component: OrderTable,
});
```

Columns must be stable (module scope or `useMemo`), since cells render as components.

### Cells

Every table writes its cells the same way (`Dash`, `DateCell` and `MoneyCell` come from `@/components/data-table`):

- **Nothing**: `<Dash />`. Never "-", "N/A" or a blank cell.
- **A timestamp**: `<DateCell value={…} />`, the date with the time-ago on hover, in the page's language. `time={false}` for a day.
- **Money**: `<MoneyCell value={…} currency="USD" />`, the code after the amount. Never "$".
- **Any other number**: `formatNumber(n)`.
- **A state**: `<StatusBadge status={…} />` (`components/status-badge.tsx`). A new state word goes in its `STATUSES` map, with its message, not a variant picked at the call site.
- **A kind**: `<TypeBadge type={…} icons={…} />` (`components/type-badge.tsx`). The icon map sits beside the type in the feature's `types.ts` (`CATEGORY_ICONS`). Kinds stay grey: colour is for states.

Wherever something with icons is picked, its options carry them too: a filter option's `icon`, a `SelectField` item's `icon`, `EnumField`'s `icons`.

A column of numbers or money takes `meta: { align: "end" }`, and its header, cells and loading skeleton line up on the end; ids stay at the start. One value per column: a second number (a discount) is its own column, not a line under the first. The id column's header is "#", with `meta: { label }` to name it in the View menu.

Row actions go last, in `<div className="flex items-center justify-end gap-1">`, as icon-only `variant="ghost" size="icon"` buttons. `DialogButton` and `ConfirmDialogButton` take a `tooltip`, which is also their `aria-label`. Edit is the `Edit` icon; Delete is `Trash2` with `text-destructive hover:text-destructive`.

The table's own tools are 32px (`size="icon-sm"`); give the buttons in `actions` `size="sm"` to match.

### Totals

`stats` puts a tile per total over the table, declared up front so nothing shifts when they load. The numbers come from the `additional` that `queryFn` returns with the page, and cover the whole filtered list, not just the page:

```tsx
const stats: TableStat[] = [{ key: "paid", label: m.orders_paid_usd }];

<DataTable stats={stats} queryFn={getOrders} … />; // getOrders returns { items, total, additional: { paid: 1250.5 } }
```

### Filters

Pass `filters` and the table shows a filter bar above the rows:

- **Pinned filters** (`pinned: true`) sit first in the table's header (on a phone, in its top row, outside the ⋮ menu) and apply as you type. That's where a table's search box goes, never behind «+ Filter». Its label says what it searches.
- **The rest** are added from «+ Filter», a searchable list, so a table with many filters stays easy to use. Each set filter shows as a chip, e.g. «Status: Pending, Shipped». Clicking a chip edits that filter alone in a popover, and its × removes it. A «+» after the chips adds another.
- **Changes apply at once**, as in Linear: there's no Apply button. Picking an option applies right away; typing applies after a short pause.

Every filter has a `name` (its URL key), a `label` (a message function) and a `type`; the bar draws the editor for the type:

| `type`                   | Extra field | Editor                                                                                                                                                                      |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select` / `multiselect` | `options`   | A list with a search line: a check mark for one pick, checkboxes for several. In «+ Filter» the values open in a submenu.                                                   |
| `date`                   |             | A calendar. «+ Filter» offers «1 day ago» … «1 year ago», and «Custom…» opens a dialog to pick a day.                                                                      |
| `text`                   |             | A text box, e.g. «Product contains: pro». Pinned, it's the table's search box, with the label as its placeholder.                                                         |
| `number`                 |             | A range: a «from» and a «to» box, either of which may be empty. The value is `"min..max"` (`"100.."`, `"..500"`); `parseRange` splits it for the API.                     |
| `custom`                 | `input`     | Your own field, reading its name and value from the form's field context.                                                                                                   |

Any filter can also be `pinned`, set `formatValue` (how the chip reads the value; for a `number`, each end) and `onValueChange`.

```tsx
const filters: FilterDef[] = [
  { name: "q", label: m.orders_search, type: "text", pinned: true },
  {
    name: "status",
    label: m.orders_status,
    type: "multiselect", // the chip reads the picked labels, e.g. «Status: Pending, Shipped»
    options: () => Object.values(OrderStatus).map((status) => ({ value: status, label: statusLabel[status]() })),
  },
  { name: "created_at_from", label: m.orders_created_from, type: "date" },
  {
    name: "total",
    label: m.orders_total,
    type: "number", // «Total: $100 – $500», «from $100», «to $500»
    formatValue: (value) => `$${formatNumber(Number(value))}`,
  },
  { name: "product", label: m.orders_product_contains, type: "text" },
];
```

Filter values reach the API as strings (or string arrays), the same as from a pasted URL.

## API calls

`api()` in `src/configs/api.ts` adds the base URL, the Bearer token and a 30s timeout. On an error it:

- shows a toast with the body's `error`, unless the call passes `silent: true`
- logs out on a 401: the token and the query cache are cleared and the app goes to `/auth`, without a reload
- reads per-field messages from `{ "errors": { "name": "…" } }`. In a form's `onSubmit`, `applyApiFieldErrors(formApi, error)` shows them under the fields (see the product form).
