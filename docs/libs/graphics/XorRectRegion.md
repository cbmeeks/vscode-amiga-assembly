
**NAME**

XorRectRegion -- Perform 2d XOR operation of rectangle
with region, leaving result in region

**SYNOPSIS**

```c
    status = XorRectRegion(region,rectangle)
    d0                     a0      a1

    BOOL XorRectRegion( struct Region *, struct Rectangle * );

```
Links: [Region](_00B7.md) [Rectangle](_00A6.md) 

**FUNCTION**

Add portions of rectangle to region if they are not in
the region.
Remove portions of rectangle from region if they are
in the region.

**INPUTS**

region - pointer to [Region](_00B7.md) structure
rectangle - pointer to [Rectangle](_00A6.md) structure

**RESULTS**

status - return TRUE if successful operation
return FALSE if ran out of memory

BUGS

**SEE ALSO**

[OrRegionRegion](OrRegionRegion.md) [AndRegionRegion](AndRegionRegion.md) [graphics/regions.h](_00B7.md)
