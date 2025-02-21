declare interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<any>): void
  }
  
  declare interface FetchEvent extends Event {
    request: Request
    respondWith(response: Promise<Response> | Response): void
  }
  
  declare interface ServiceWorkerGlobalScope {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
    registration: ServiceWorkerRegistration
  }
  
  