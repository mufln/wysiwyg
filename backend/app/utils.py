def require(flag: bool, message: str):
    """Simple decorator that insures that function can only be called when a certain condition is met."""
    def _inner(f):
        if not flag:

            def f():
                return {"error": message}

        return f

    return _inner
