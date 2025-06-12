const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new", // use true if deploying to Railway
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://academia.srmist.edu.in', { waitUntil: 'networkidle2' });

    // Sample login logic — you'll need to update selectors accordingly
    await page.type('#userId', username);
    await page.type('#password', password);
    await page.click('#loginButton');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Insert scraping logic here
    const attendanceData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.attendance-table-row')).map(row => {
        return {
          subject: row.querySelector('.subject')?.innerText || '',
          attendance: row.querySelector('.attendance')?.innerText || ''
        };
      });
    });

    await browser.close();

    res.json({
      success: true,
      attendance: attendanceData,
      timetable: [] // optional: you can add timetable scraping later
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed. SRM site might have changed.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
