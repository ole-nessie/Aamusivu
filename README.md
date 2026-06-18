# Aamusivu

A minimalist morning dashboard webpage for mobile use. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Weather**: Current temperature for Itä-Pasila, Hyvinkää, and Lammi (from Open-Meteo)
- **Nameday**: Daily Finnish nameday
- **Comics**: Daily comics from Helsingin Sanomat based on day of week
  - Monday-Saturday: Fingerpori, Fok_It, Harald Hirmuinen
  - Sunday: Lassi ja Leevi, Keskenkasvuisia
  - Comics display as clickable links that work on mobile with your HS subscription
- **News**: Latest headlines from Yle Uutiset

## Setup for GitHub Pages

1. In your repo, enable GitHub Pages (Settings → Pages)
2. Set source to main branch (or your preferred branch)
3. Access your site at `https://username.github.io/Aamusivu`

## Local Testing

Simply open `index.html` in your web browser. The page will load all data automatically.

## Mobile Use

The page is optimized for mobile viewing. When opening on your mobile phone:
- Weather, nameday, and news load automatically
- Comic links open in your browser where you're logged into HS.fi, so they show your subscription content
- All sections are touch-friendly and readable at small screen sizes

## Data Sources

- **Weather**: [Open-Meteo API](https://open-meteo.com) (free, no authentication needed)
- **Namedays**: Hardcoded Finnish nameday calendar
- **Comics**: Helsingin Sanomat sarjakuvat section
- **News**: [Yle Uutiset RSS feed](https://feeds.yle.fi/uutiset/v1)

## Notes

- Weather uses your local timezone (Europe/Helsinki by default)
- Comics require an active HS subscription to view full content on mobile
- The page loads data on open with no auto-refresh
- All functionality works offline for cached data
