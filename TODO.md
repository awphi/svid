# TODO - next

- [x] Clean-up the preload/main process IPC API shenanigans with something like `electron-trpc`
- [x] ~~Ditch usage of `express`, `cors` etc. using `interceptFileProtocol` as shown here - https://stackoverflow.com/questions/38204774/serving-static-files-in-electron-react-app~~ - Doesn't work well with `<video>`
- [x] Slim down the IPC API and clarify names a bit better
- [x] Use `svelte-splitpanes` to make the panels variable size
- [x] ~~Overhaul look and feel using shadcn, ditching most of the custom tailwind styling~~ Decided not to pursue this as I don't need many components
- [x] ~~Replace native context menus with HTML-based ones using shadcn + delete from IPC API~~ Maybe this can be pursued later but not necessary for now
- [x] Replace `iconify` with some SVGs?
- [x] Implement chunkified audiowaveform processor
- [x] Use chunkified audiowaveform processor in the renderer thread - will need some sort of client-side helper to munge the data together with a minimal API
- [x] Add an indicator to the status bar to show how many audio waveform chunks are loaded - simple progress bar with percentage should do
- [x] ~~Try treeview indicators in the source selectors so you can traceback to the route folder~~ Didn't like this
- [x] Tweening of dynamic numbers - sub offset and audio chunk proc. percentage
- [x] Layout to avoid overlapping subs
- [ ] Improve canvas clarity of audio and subs vis
- [ ] Subtitle block layout to avoid clashing
- [ ] Tooltips on unclear things - sub offset, audio chunk processing, add buttons, path on disk of tree etc.
- [ ] App icon
- [ ] Auto subtitle sync - there's a few implementations online to take inspo from. Maybe use external lib if a good one exists? Just edit the subtitles in place
