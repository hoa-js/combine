import type { HoaContext, HoaMiddleware } from 'hoa'
import { compose } from 'hoa'

type Condition = (ctx: HoaContext) => boolean | Promise<boolean>

/**
 * Create a composed middleware that runs the first middleware that returns true.
 *
 * @param middleware - An array of HoaMiddleware or Condition functions.
 * Middleware is applied in the order it is passed, and if any middleware exits without returning
 * an exception first, subsequent middleware will not be executed.
 * You can also pass a condition function that returns a boolean value. If returns true
 * the evaluation will be halted, and rest of the middleware will not be executed.
 * @returns A composed middleware.
 */
export const some = (...middlewares: (HoaMiddleware | Condition)[]): HoaMiddleware => {
  return async function some (ctx, next) {
    let isNextCalled = false
    let lastError: Error | null = null
    const wrappedNext = () => {
      isNextCalled = true
      return next()
    }

    for (const middleware of middlewares) {
      try {
        const result = await middleware(ctx, wrappedNext)
        if (result === true) {
          await wrappedNext()
        } else if (result === false) {
          lastError = new Error('No successful middleware found')
          continue
        }
        lastError = null
        break
      } catch (error) {
        lastError = error
        if (isNextCalled) {
          break
        }
      }
    }

    if (lastError) {
      throw lastError
    }
  }
}

/**
 * Create a composed middleware that runs all middleware and throws an error if any of them fail.
 *
 * @param middleware - An array of HoaMiddleware or Condition functions.
 * Middleware is applied in the order it is passed, and if any middleware throws an error,
 * subsequent middleware will not be executed.
 * You can also pass a condition function that returns a boolean value. If returns false
 * the evaluation will be halted, and rest of the middleware will not be executed.
 * @returns A composed middleware.
 */
export const every = (...middlewares: (HoaMiddleware | Condition)[]) => {
  const handler = compose(middlewares.map((middleware) => {
    return async function wrappedFunction (ctx, next) {
      const result = await middleware(ctx, next)
      if (result === false) {
        throw new Error('Unmet condition')
      }
      await next()
    } as HoaMiddleware
  }))
  return handler
}

/**
 * Create a composed middleware that runs all middleware except when the condition is met.
 *
 * @param condition - A Condition function.
 * If there are multiple targets to match any of them, they can be passed as an array.
 * If a Condition function is passed, it will be evaluated against the request context.
 * @param middleware - A composed middleware
 * @returns A composed middleware.
 */
export const except = (condition: Condition | Condition[], ...middlewares: HoaMiddleware[]) => {
  const conditions = (Array.isArray(condition) ? condition : [condition])
  const handler = some((ctx: HoaContext) => conditions.some((c) => c(ctx)), every(...middlewares))
  return handler
}
