import { Controller } from "stimulus"
import { isDevelopment } from "../models/environment"
import Cookie from "js-cookie"

export default class AnalyticsController extends Controller {
  /**
   * Bind the click() and submit() DOM events to analytics events if
   * available, and fire the pageClick analytics event immediately.
   */
  connect() {
    Cookie.get('analytics_session') || this.createSession()

    if (this.data.has("click")) {
      this.element.addEventListener("click", this.click.bind(this))
    }

    if (this.data.has("submit")) {
      this.element.addEventListener("submit", this.submit.bind(this))
    }

    if (this.data.has("impression")) {
      this.sendProductList()
    }

    this.adapters.forEach(adapter => adapter.initialize(this))
    this.send('pageView')
  }

  get adapters() {
    return this.config.adapters.map(Adapter => new Adapter(this.config))
  }

  get config() {
    return this.app.config.analytics
  }

  get breadcrumbs() {
    const elements = document.querySelectorAll('.breadcrumbs .breadcrumbs__node')

    return elements.map(element => element.innerText.trim()).join('/')
  }

  get disabled() {
    const meta = document.querySelector('meta[property=analytics]')

    return meta.getAttribute('content') === 'disable'
  }

  createSession() {
    const sessions = Cookie.get('sessions') || 0

    Cookie.set('sessions', parseInt(sessions) + 1)
    Cookie.set('analytics_session', 'true', this.config.sessionExpire)

    return { sessions }
  }

  calculateListPosition(position, page, perPage) {
    position = position || 0
    page = page || 1
    perPage = perPage || 20

    return position + ((page - 1) * perPage)
  }

  setupProductList() {
    const { payload } = this.data.get("impression")
    const page = payload.page
    const perPage = payload.per_page
    const attribute = 'data-analytics-impression'
    const selector = `[${attribute}]`
    let index = 0
    const elements = this.element.querySelectorAll(selector)
    const impressions = elements.map(element => {
      const impression = JSON.parse(element.getAttribute(attribute))
      index += 1

      impression.position = this.calculateListPosition(index, page, perPage)

      return impression
    })

    if (!impressions.length) { return }

    payload.name = payload.name || this.breadcrumbs
    payload.impressions = impressions

    this.send('productList', payload)
  }

  send(event, data = {}) {
    if (this.disabled) { return }
    if (isDevelopment) {
      console.log('Firing analytics event', event, 'with', data)
    }

    this.adapters.forEach(adapter => adapter.handle(event, data))
  }

  click(event) {
    const closestList = this.element.parent.closest('[data-controller=analytics]')
      .filter(element => {
        const data = JSON.parse(element.getAttribute("data-analytics-impression"))

        return data.event === "productList"
      })
    const { name, page, per_page } = JSON.parse(
      closestList.getAttribute("data-analytics-impression")
    )
    const { payload } = JSON.parse(this.data.get("click"))
    const impressions = closestList.querySelectorAll("[data-analytics-impression]")
    const thisImpression = impressions.filter(impression => impression === this.element)
    const position = this.calculateListPosition(
      impressions.index(thisImpression), page, per_page
    )

    payload.list = name || this.breadcrumbs
    payload.position = position

    if (this.config.preventDomEvents) { event.preventDefault() }

    this.send('productClick', payload)
  }

  submit(e) {
    const { event, payload } = this.data.get("submit")
    const quantity = this.element.querySelector('[name=quantity]')
                                 .getAttribute("value")

    if (this.config.preventDomEvents) { e.preventDefault() }

    if (event === 'addToCart') {
      payload.quantity = quantity
    }

    if (event === 'updateCartItem') {
      payload.from = payload.quantity
      payload.to = quantity
    }

    this.send(event, payload)
  }
}
