const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const cache = require('memory-cache')
const date = new Date()

const CACHE_TTL = 120000 // Time to live in milliseconds (e.g., 2 minutes)

router.get('/', async (req, res) => {
  res.locals.month = date.toLocaleString('default', { month: 'long' })
  res.locals.year = date.getFullYear()

  const payData = await fetchData('https://raw.githubusercontent.com/alphagov/pay-product-page/refs/heads/main/data/performance.json', 'payDataCache')

  let totalPaymentAmount = payData['totalPaymentAmount'].replace('billion', 'B')
  res.locals.totalPaymentAmount = totalPaymentAmount
  res.locals.numberOfPayments = payData['numberOfPayments'].replace('million', 'M')
  res.locals.payNumberOfServices = payData['numberOfServices']
  res.locals.payNumberOfOrganisations = payData['numberOfOrganisations']

  const notifyData = await fetchData('https://www.notifications.service.gov.uk/features/performance.json', 'notifyDataCache')
  console.log(notifyData)
  res.locals.notifyTotalMsgs = (notifyData['total_notifications'] / 1e9).toFixed(1) + "B"
  res.locals.notifyLive = notifyData['count_of_live_services_and_organisations']['services']
  res.locals.notifyOrgs = notifyData['count_of_live_services_and_organisations']['organisations']

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
