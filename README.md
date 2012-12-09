ot
==

Operational Transformation for Multimedia

## TODO
1. paramatrisation (url) of the server to provide multiple drawings
2. supports all operations on buffer[0] (connected-disconnected)
3. test and support undo-redo for imported images
4. make it pretty

## Ideas
- argue about the dilemma: do we add text fields ? (tablettes vs desktop)
- resizing the drawings: identify how we can use seam carving
- subdivide/merge objects to rework them <= AWESOME but need massive code refactoring
- handle non-trivial conflicts => overlapping 3D (need previous)

## Current state (main points)
- type of data supported : path and raster
- operation supported : draw, move, delete
- undo-redo 
- import & export images
- latency: the app is functional even if disconnected

