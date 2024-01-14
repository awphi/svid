# TODO

Honestly, it might be worth starting completely over and copy-pasting the few complex bits of code I want to still use but here's everything I want to do:

- [ ] Clean-up the preload/main process IPC API shenanigans with something like `electron-trpc`
- [ ] Slim down the IPC API and clarify names a bit better
- [ ] Replace `iconify` with some SVGs
- [ ] Use `svelte-splitpanes` to make the panels variable size
- [ ] Overhaul look and feel using shadcn, ditching all the custom tailwind styling
- [ ] Ditch usage of `express`, `cors` etc. using `interceptFileProtocol` as shown here - https://stackoverflow.com/questions/38204774/serving-static-files-in-electron-react-app
