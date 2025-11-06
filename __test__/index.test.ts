import { Hoa } from 'hoa'
import type { HoaContext } from 'hoa'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { every, except, some } from '../src/index'
import { tinyRouter } from '@hoajs/tiny-router'

describe('combine middleware', () => {
  describe('some()', () => {
    let app: Hoa

    beforeEach(() => {
      app = new Hoa()
      app.extend(tinyRouter())
    })

    it('should execute the first middleware that returns true', async () => {
      const middleware1 = jest.fn().mockImplementation(() => true)
      const middleware2 = jest.fn().mockImplementation(async (ctx, next) => {
        await next()
      })
      const middleware3 = jest.fn().mockImplementation(async (ctx, next) => await next())

      app.get('/test', some(middleware1, middleware2, middleware3), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).not.toHaveBeenCalled()
      expect(middleware3).not.toHaveBeenCalled()
    })

    it('should throw error when middleware throw error', async () => {
      const middleware1 = jest.fn().mockImplementation(() => false)
      const middleware2 = jest.fn().mockImplementation(async (ctx, next) => {
        await next()
        throw new Error('')
      })
      const middleware3 = jest.fn().mockImplementation(async (ctx, next) => await next())

      app.get('/test', some(middleware1, middleware2, middleware3), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(500)
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
      expect(middleware3).not.toHaveBeenCalled()
    })

    it('should execute next middleware if previous middleware throws an error', async () => {
      const error = new Error('Test error')
      const middleware1 = jest.fn().mockRejectedValue(error)
      const middleware2 = jest.fn().mockResolvedValue(true)

      app.get('/test', some(middleware1, middleware2), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('success')
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
    })

    it('should throw error if all middlewares throw errors', async () => {
      const error1 = new Error('Error 1')
      const error2 = new Error('Error 2')
      const middleware1 = jest.fn().mockRejectedValue(error1)
      const middleware2 = jest.fn().mockRejectedValue(error2)

      app.get('/test', some(middleware1, middleware2))

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(500)
    })

    it('should handle condition functions that return boolean', async () => {
      const condition1 = jest.fn().mockImplementation(() => false)
      const condition2 = jest.fn().mockImplementation(() => true)

      app.get('/test', some(condition1, condition2), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('success')
      expect(condition1).toHaveBeenCalled()
      expect(condition2).toHaveBeenCalled()
    })
  })

  describe('every()', () => {
    let app: Hoa

    beforeEach(() => {
      app = new Hoa()
      app.extend(tinyRouter())
    })

    it('should execute all middlewares if all pass', async () => {
      const middleware1 = jest.fn().mockResolvedValue(true)
      const middleware2 = jest.fn().mockResolvedValue(true)

      app.get('/test', every(middleware1, middleware2), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('success')
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
    })

    it('should throw error if any middleware returns false', async () => {
      const middleware1 = jest.fn().mockResolvedValue(true)
      const middleware2 = jest.fn().mockResolvedValue(false)

      app.get('/test', every(middleware1, middleware2))

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(500)
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
    })

    it('should throw error if any middleware throws an error', async () => {
      const error = new Error('Test error')
      const middleware1 = jest.fn().mockResolvedValue(true)
      const middleware2 = jest.fn().mockRejectedValue(error)

      app.get('/test', every(middleware1, middleware2))

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(500)
    })
  })

  describe('except()', () => {
    let app: Hoa
    beforeEach(() => {
      app = new Hoa()
      app.extend(tinyRouter())
    })

    it('should execute middleware when condition is false', async () => {
      const condition = jest.fn().mockImplementation(() => false)
      const middleware = jest.fn().mockImplementation(async (ctx, next) => await next())

      app.get('/test', except(condition, middleware), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('success')
      expect(condition).toHaveBeenCalled()
      expect(middleware).toHaveBeenCalled()
    })

    it('should not execute middleware when condition is true', async () => {
      const condition = jest.fn().mockImplementation(() => true)
      const middleware = jest.fn().mockImplementation((ctx, next) => next())

      app.get('/test', except(condition, middleware), (ctx: HoaContext) => {
        ctx.res.body = 'should not reach here'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('should not reach here')
      expect(condition).toHaveBeenCalled()
      expect(middleware).not.toHaveBeenCalled()
    })

    it('should handle array of conditions (OR logic)', async () => {
      const condition1 = jest.fn().mockImplementation(() => false)
      const condition2 = jest.fn().mockImplementation(() => true)
      const middleware = jest.fn()

      app.get('/test', except([condition1, condition2], middleware), (ctx: HoaContext) => {
        ctx.res.body = 'should not reach here'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('should not reach here')
      expect(condition1).toHaveBeenCalled()
      expect(condition2).toHaveBeenCalled()
      expect(middleware).not.toHaveBeenCalled()
    })

    it('should handle multiple middlewares with every()', async () => {
      const condition = jest.fn().mockImplementation(() => false)
      const middleware1 = jest.fn().mockImplementation((ctx, next) => next())
      const middleware2 = jest.fn().mockImplementation((ctx, next) => next())

      app.get('/test', except(condition, middleware1, middleware2), (ctx: HoaContext) => {
        ctx.res.body = 'success'
      })

      const response = await app.fetch(new Request('http://localhost/test'))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('success')
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
    })
  })
})
