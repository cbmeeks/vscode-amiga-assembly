
**NAME**

AddDevice -- add a device to the system

**SYNOPSIS**

```c
    AddDevice(device)
              A1

    void AddDevice(struct Device *);

```
Links: [Device](_0087.md) 

**FUNCTION**

This function adds a new device to the system device list, making
it available to other programs.  The device must be ready to be
opened at this time.

**INPUTS**

device - pointer to a properly initialized device node

**SEE ALSO**

[RemDevice](RemDevice.md), [OpenDevice](OpenDevice.md), [CloseDevice](_04CC.md), [MakeLibrary](MakeLibrary.md)
