const express = require("express")
const puppeteer = require("puppeteer")
const cors = require("cors")

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}


const PORT = process.env.PORT || 3011
const app = express()
 const environment = process.env.NODE_ENV
 const isProduction = environment === "production"

const takeScreenshot = async (site) => {
  {
    if (!site) {
      return res.send("No URL provided")
    }
    let page
    const browser = await puppeteer.launch({
      ...(isProduction && { executablePath: process.env.CHROMIUM_PATH }),
      headless: "new",
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ], // Optimize for stability
    })

    try {
      console.log(`📸 Capturing: ${site.url}`)
      page = await browser.newPage()

      // Set a realistic user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
      )
      await page.goto(site.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })

      await new Promise((resolve) => setTimeout(resolve, 5000))

      const screenshot = await page.screenshot({
        fullPage: false,
        type: "png",
      })

      return screenshot
    } catch (err) {
      console.error(`❌ Failed to capture ${site.url}:`, err.message)
    } finally {
      if (page) await page.close()
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    await browser.close()
    console.log("✅ All captures completed.")
  }
}


app.use(cors(corsOptions))
app.get("/screenshot", async (req, res) => {
  if (!req.query.url) {
    return res.send("No URL provided")
  }
  const image = await takeScreenshot({ url: req.query.url })
  res.send({
    image: "data:image/png;base64," + Buffer.from(image).toString("base64"),
  })
})

app.listen(PORT, () => {
  console.log(`listening to port: ${PORT}`)
})
