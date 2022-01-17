
**NAME**

FindDosEntry -- Finds a specific Dos [List](_007D.md) entry (V36)

**SYNOPSIS**

```c
    newdlist = FindDosEntry(dlist,name,flags)
    D0                       D1    D2   D3

    struct DosList *FindDosEntry(struct DosList *,STRPTR,ULONG)

```
Links: [DosList](_0078.md) [DosList](_0078.md) 

**FUNCTION**

Locates an entry on the device list.  Starts with the entry dlist.
NOTE: must be called with the device list locked, no references may be
made to dlist after unlocking.

**INPUTS**

dlist    - The device entry to start with.
name     - Name of device entry (without ':') to locate.
flags    - Search control flags.  Use the flags you passed to
[LockDosList](LockDosList.md), or a subset of them.  LDF_READ/LDF_WRITE are
not required for this call.

RESULT
newdlist - The device entry or NULL

**SEE ALSO**

[AddDosEntry](AddDosEntry.md), [RemDosEntry](RemDosEntry.md), [NextDosEntry](NextDosEntry.md), [LockDosList](LockDosList.md),
[MakeDosEntry](MakeDosEntry.md), [FreeDosEntry](FreeDosEntry.md)
