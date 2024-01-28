# TODO - next

- [x] Clean-up the preload/main process IPC API shenanigans with something like `electron-trpc`
- [x] ~~Ditch usage of `express`, `cors` etc. using `interceptFileProtocol` as shown here - https://stackoverflow.com/questions/38204774/serving-static-files-in-electron-react-app~~ - Doesn't work well with `<video>`
- [x] Slim down the IPC API and clarify names a bit better
- [x] Use `svelte-splitpanes` to make the panels variable size
- [x] ~~Overhaul look and feel using shadcn, ditching most of the custom tailwind styling~~ Decided not to pursue this as I don't need many components
- [x] ~~Replace native context menus with HTML-based ones using shadcn + delete from IPC API~~ Maybe this can be pursued later but not necessary for now
- [ ] Replace `iconify` with some SVGs?
- [ ] Try treeview indicators in the source selectors so you can traceback to the route folder
- [ ] Improve canvas clarity of audio and subs vis
