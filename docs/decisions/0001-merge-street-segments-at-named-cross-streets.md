# 0001 - Merge street segments at named cross streets

In the context of turning the raw Chicago street-centerline dataset into explorable segments (R6),
facing the fact that the raw data breaks each street at every real-world node, including minor
alleys and courts, not just named cross streets,
we decided for merging consecutive raw pieces (by shared node id) into one segment per block
between two *named* cross streets, and neglected keeping every raw dataset break as its own
separate clickable segment,
to achieve exploration behavior where every clickable segment corresponds to one visible block
between two real, recognizable intersections, matching how a person actually thinks about "a
block" when exploring a city,
accepting that a few named streets' minor unnamed alley crossings are no longer separate click
targets, and that Grant Park's own signed drives (Balbo, Congress, Jackson, Monroe, Roosevelt Dr)
had to be special-cased as cross streets for Columbus Dr and Lake Shore Dr, since without them
those two streets would merge straight through the entire park into one unrealistic block.
