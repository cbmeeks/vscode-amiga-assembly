
**NAME**

PrintFault -- Returns the text associated with a DOS error code (V36)

**SYNOPSIS**

```c
    success = PrintFault(code, header)
    D0                    D1     D2

    BOOL PrintFault(LONG, STRPTR)

```
**FUNCTION**

This routine obtains the error message text for the given error code.
This is similar to the [Fault](Fault.md) function, except that the output is
written to the default output channel with buffered output.
The value returned by [IoErr](IoErr.md) is set to the code passed in.

**INPUTS**

code   - Error code
header - header to output before error text

RESULT
success - Success/failure code.

**SEE ALSO**

[IoErr](IoErr.md), [Fault](Fault.md), [SetIoErr](SetIoErr.md), [Output](Output.md), [FPuts](FPuts.md)
