/**
 * @name Missing CSRF middleware
 * @description Using cookies without CSRF protection may allow malicious websites to
 *              submit requests on behalf of the user.
 * @kind problem
 * @problem.severity error
 * @security-severity 8.8
 * @precision high
 * @id sarradabet/missing-csrf-middleware
 * @tags security
 *       external/cwe/cwe-352
 */

import javascript
import CsrfCsrfExtension

/** Gets a property name of `req` which refers to data usually derived from cookie data. */
string cookieProperty() { result = "session" or result = "cookies" or result = "user" }

/**
 * Holds if `handler` uses cookies.
 */
predicate isRouteHandlerUsingCookies(Routing::RouteHandler handler) {
  exists(DataFlow::PropRef value |
    value = handler.getAParameter().ref().getAPropertyRead(cookieProperty()).getAPropertyReference() and
    not value.getPropertyName().regexpMatch("(?i).*(csrf|xsrf|captcha).*") and
    not value = any(DataFlow::InvokeNode call).getCalleeNode()
  )
}

/**
 * Holds if `route` is preceded by the cookie middleware `cookie`.
 */
predicate hasCookieMiddleware(Routing::Node route, Http::CookieMiddlewareInstance cookie) {
  route.isGuardedBy(cookie)
}

/**
 * Gets an expression that creates a route handler which protects against CSRF attacks.
 */
DataFlow::SourceNode csrfMiddlewareCreation() {
  exists(DataFlow::SourceNode callee | result = callee.getACall() |
    callee = DataFlow::moduleImport(["csurf", "tiny-csrf"])
    or
    callee = DataFlow::moduleImport("lusca") and
    exists(result.(DataFlow::CallNode).getOptionArgument(0, "csrf"))
    or
    callee = DataFlow::moduleMember("lusca", "csrf")
    or
    callee = DataFlow::moduleMember("express", "csrf")
  )
  or
  result = csrfCsrfMiddlewareCreation()
  or
  result = Fastify::server().getAPropertyRead("csrfProtection")
}

/** Holds if the given property has a name indicating that it refers to a CSRF token. */
pragma[nomagic]
private predicate isCsrfProperty(DataFlow::PropRef ref) {
  ref.getPropertyName().regexpMatch("(?i).*(csrf|xsrf).*")
}

private DataFlow::SourceNode nodeLeadingToCsrfWriteOrCheck(DataFlow::TypeBackTracker t) {
  t.start() and
  exists(DataFlow::PropRef ref |
    ref = result.getAPropertyRead(cookieProperty()).getAPropertyReference()
  |
    ref instanceof DataFlow::PropWrite and
    isCsrfProperty(ref)
    or
    exists(EqualityTest test |
      test.getAnOperand().flow().getALocalSource() = ref and
      isCsrfProperty(test.getAnOperand().flow().getALocalSource())
    )
    or
    exists(DataFlow::CallNode call |
      call.getCalleeName().regexpMatch("(?i).*(check|verify|valid|equal).*") and
      call.getAnArgument().getALocalSource() = ref and
      isCsrfProperty(call.getAnArgument().getALocalSource())
    )
  )
  or
  exists(DataFlow::TypeBackTracker t2 | result = nodeLeadingToCsrfWriteOrCheck(t2).backtrack(t2, t))
}

private Routing::RouteHandler getAHandlerSettingCsrfCookie() {
  exists(Http::CookieDefinition setCookie |
    setCookie.getNameArgument().getStringValue().regexpMatch("(?i).*(csrf|xsrf).*") and
    result = Routing::getRouteHandler(setCookie.getRouteHandler())
  )
}

predicate isCsrfProtectionRouteHandler(Routing::RouteHandler handler) {
  handler.getAParameter() = nodeLeadingToCsrfWriteOrCheck(DataFlow::TypeBackTracker::end())
  or
  handler = getAHandlerSettingCsrfCookie()
}

API::CallNode passportAuthenticateCall() {
  result = API::moduleImport("passport").getMember("authenticate").getACall()
}

API::CallNode nonSessionBasedAuthMiddleware() {
  result = passportAuthenticateCall() and
  result.getParameter(1).getMember("session").asSink().mayHaveBooleanValue(false)
}

API::CallNode authMiddlewareImmuneToCsrf() {
  result = passportAuthenticateCall() and
  not result.getArgument(0).getStringValue() = "local"
}

Routing::Node getACsrfMiddleware() {
  result = Routing::getNode(csrfMiddlewareCreation())
  or
  result = Routing::getNode(nonSessionBasedAuthMiddleware())
  or
  isCsrfProtectionRouteHandler(result)
}

predicate hasCsrfMiddleware(Routing::RouteHandler handler) {
  handler.isGuardedByNode(getACsrfMiddleware())
}

from
  Routing::RouteSetup setup, Routing::Node setupArg, Routing::RouteHandler handler,
  Http::CookieMiddlewareInstance cookie
where
  setup.getAChild() = setupArg and
  setupArg.getAChild*() = handler and
  isRouteHandlerUsingCookies(handler) and
  hasCookieMiddleware(handler, cookie) and
  not hasCookieMiddleware(Routing::getNode(cookie), _) and
  not hasCsrfMiddleware(handler) and
  not setup.getAChild*() = getACsrfMiddleware() and
  not handler.getAChild*() = Routing::getNode(authMiddlewareImmuneToCsrf()) and
  setup.getOwnHttpMethod().isUnsafe()
select cookie, "This cookie middleware is serving a $@ without CSRF protection.", setupArg,
  "request handler"
