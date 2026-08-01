import javascript

/**
 * Gets `doubleCsrfProtection` from a `doubleCsrf(...)` call on the `csrf-csrf` module.
 */
DataFlow::SourceNode csrfCsrfMiddlewareCreation() {
  exists(DataFlow::CallNode call |
    call.getCalleeName() = "doubleCsrf" and
    call.getCallee().(DataFlow::PropRead).getBase().(DataFlow::SourceNode) =
      DataFlow::moduleImport("csrf-csrf") and
    result = call.getAPropertyRead("doubleCsrfProtection")
  )
  or
  exists(DataFlow::PropRead prop |
    prop.getPropertyName() = "doubleCsrfProtection" and
    exists(DataFlow::CallNode call |
      call = prop.getBase().getALocalSource() and
      call.getCalleeName() = "doubleCsrf" and
      call.getCallee().(DataFlow::PropRead).getBase().(DataFlow::SourceNode) =
        DataFlow::moduleImport("csrf-csrf")
    ) and
    result = prop
  )
  or
  exists(DataFlow::FunctionNode fn |
    fn.getFunction().getName() = "csrfProtection" and
    exists(DataFlow::CallNode delegateCall |
      delegateCall.getCalleeName() = "doubleCsrfProtection" and
      delegateCall.getEnclosingFunction() = fn.getFunction()
    ) and
    result = fn
  )
}
