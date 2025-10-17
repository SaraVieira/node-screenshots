const express = require("express")
const puppeteer = require("puppeteer")

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

      // Navigate with a longer timeout and lenient wait condition
      await page.goto(site.url, {
        waitUntil: "networkidle2", // Use 'networkidle2' for faster loading
        timeout: 120000, // Increase timeout to 2 minutes
      })

      // Wait for additional time to ensure dynamic content loads
      await new Promise((resolve) => setTimeout(resolve, 5000))

      const screenshot = await page.screenshot({
        fullPage: false,
        type: "png",
      })

      return screenshot
    } catch (err) {
      console.error(`❌ Failed to capture ${site.url}:`, err.message)
      // Optionally, add retry logic here
    } finally {
      // Close the page to free resources
      if (page) await page.close()
      // Add a small delay between captures to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    await browser.close()
    console.log("✅ All captures completed.")
  }
}

app.get("/screenshot", async (req, res) => {
  const image = await takeScreenshot({ url: req.query.url })
  res.send({
    image: "data:image/png;base64," + Buffer.from(image).toString("base64"),
  })
})

app.listen(PORT, () => {
  console.log(`listening to port: ${PORT}`)
})
