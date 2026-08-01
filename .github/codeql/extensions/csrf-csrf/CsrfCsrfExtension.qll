import javascript

/**
 * Gets a node referring to csrf-csrf `doubleCsrfProtection`, including re-exports.
 */
DataFlow::SourceNode csrfCsrfMiddlewareCreation() {
  exists(DataFlow::PropRead prop, DataFlow::CallNode call |
    prop.getPropertyName() = "doubleCsrfProtection" and
    call.getCalleeNode() = DataFlow::moduleMember("csrf-csrf", "doubleCsrf") and
    prop.getBase().getALocalSource() = call and
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
  or
  result = DataFlow::moduleMember("./core/middleware/CsrfMiddleware", "doubleCsrfProtection")
  or
  result =
    DataFlow::moduleMember("apps/api/src/core/middleware/CsrfMiddleware", "doubleCsrfProtection")
}
