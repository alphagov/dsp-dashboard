const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const cache = require('memory-cache')
const date = new Date()

const CACHE_KEY = 'performanceData'
const CACHE_TTL = 60000 // Time to live in milliseconds (e.g., 60 seconds)

router.get('/', async (req, res) => {
  res.locals.month = date.toLocaleString('default', { month: 'long' })
  res.locals.year = date.getFullYear()

  const payData = await fetchData('https://raw.githubusercontent.com/alphagov/pay-product-page/refs/heads/main/data/performance.json')

  let totalPaymentAmount = payData['totalPaymentAmount'].replace('billion', '')
  res.locals.totalPaymentAmount = totalPaymentAmount
  res.locals.numberOfPayments = payData['numberOfPayments'].replace('million', '')
  res.locals.payNumberOfServices = payData['numberOfServices']
  res.locals.payNumberOfOrganisations = payData['numberOfOrganisations']

  res.render('index')
})

const fetchData = async (url) => {
  const cachedData = cache.get(CACHE_KEY)
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
    cache.put(CACHE_KEY, data, CACHE_TTL)
    return data
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error)
  }
}
