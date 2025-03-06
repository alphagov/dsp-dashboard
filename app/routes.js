const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const cache = require('memory-cache')
const date = new Date()

const CACHE_TTL = 120000 // Time to live in milliseconds (e.g., 2 minutes)

router.get('/', async (req, res) => {
  res.locals.month = date.toLocaleString('default', { month: 'long' })
  res.locals.year = date.getFullYear()

  const rawPayData = await fetchData('https://api.github.com/repos/alphagov/pay-product-page/contents/data/performance.json?ref=main', 'payDataCache')
  const payData = JSON.parse(Buffer.from(rawPayData['content'], "base64").toString("utf-8"))

  const totalPaymentAmount = payData['totalPaymentAmount'].replace(' billion', '&hairsp;B')
  res.locals.totalPaymentAmount = totalPaymentAmount
  res.locals.numberOfPayments = payData['numberOfPayments'].replace(' million', '&hairsp;M')
  res.locals.payNumberOfServices = payData['numberOfServices']
  res.locals.payNumberOfOrganisations = payData['numberOfOrganisations']

  const notifyData = await fetchData('https://www.notifications.service.gov.uk/features/performance.json', 'notifyDataCache')

  res.locals.notifyTotalMsgs = (notifyData['total_notifications'] / 1e9).toFixed(1) + "&hairsp;B"
  res.locals.notifyLive = notifyData['count_of_live_services_and_organisations']['services']
  res.locals.notifyOrgs = notifyData['count_of_live_services_and_organisations']['organisations']

  const formData = await fetchData('https://www.forms.service.gov.uk/performance.json')
  res.locals.formSubmissions = formData['submissions']
  res.locals.formsPublished = formData['published']
  res.locals.formOrganisations = formData['organisations']

  res.render('index')
})

const fetchData = async (url, cacheKey) => {
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    console.log('Returning cached data')
    return cachedData
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText)
    }
    const data = await response.json()
    cache.put(cacheKey, data, CACHE_TTL)
    return data
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error)
  }
}
