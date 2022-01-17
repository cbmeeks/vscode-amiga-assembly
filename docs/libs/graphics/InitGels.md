
**NAME**

InitGels -- initialize a gel list; must be called before using gels.

**SYNOPSIS**

```c
    InitGels(head, tail, GInfo)
             A0    A1    A2

    void InitGels(struct VSprite *, struct VSprite *, struct GelsInfo *);

```
Links: [VSprite](_00C3.md) [VSprite](_00C3.md) [GelsInfo](_00AF.md) 

**FUNCTION**

Assigns the VSprites as the head and tail of the gel list in [GfxBase](_00AE.md).
Links these two gels together as the keystones of the list.
If the collHandler vector points to some memory array, sets
the BORDERHIT vector to NULL.

**INPUTS**

head  = pointer to the [VSprite](_00C3.md) structure to be used as the
gel list head
tail  = pointer to the [VSprite](_00C3.md) structure to be used as the
gel list tail
GInfo = pointer to the [GelsInfo](_00AF.md) structure to be initialized

RESULT

BUGS

**SEE ALSO**

[graphics/gels.h](_00C3.md)  [graphics/rastport.h](_00AF.md)
