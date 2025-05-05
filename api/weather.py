from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import requests
from bs4 import BeautifulSoup

app = FastAPI()

class WeatherDay(BaseModel):
    date: str
    high: float
    low: float 
    condition: str
    precipitation: float
    type: str  # 'history', 'forecast' or 'almanac'

class WeatherResponse(BaseModel):
    calendar_days: List[WeatherDay]
    
def parse_calendar_day(day_element) -> WeatherDay:
    """Parse a calendar day element"""
    try:
        # Get date
        date = day_element.select_one(".date").get_text(strip=True)
        
        # Get temperatures
        temp_div = day_element.select_one(".temperature")
        high = float(temp_div.select_one(".hi").get_text(strip=True).replace('°',''))
        low = float(temp_div.select_one(".low").get_text(strip=True).replace('°',''))
        
        # Get conditions
        condition = day_element.select_one(".phrase")
        condition_text = condition.get_text(strip=True) if condition else "N/A"
        
        # Get precipitation
        precip = day_element.select_one(".wu-value.wu-value-to")
        precipitation = float(precip.get_text(strip=True)) if precip else 0
        
        # Determine type based on class
        type = "forecast"
        if "history" in day_element.get("class", []):
            type = "history"
        elif "almanac" in day_element.get("class", []):
            type = "almanac"
            
        return WeatherDay(
            date=date,
            high=high,
            low=low,
            condition=condition_text,
            precipitation=precipitation,
            type=type
        )
    except Exception as e:
        print(f"Error parsing day: {e}")
        return None

@app.get("/api/weather", response_model=WeatherResponse)
async def get_weather():
    """Get weather data from Weather Underground"""
    
    url = "https://www.wunderground.com/calendar/ca/winnipeg"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        calendar_days = soup.select("li.calendar-day")
        
        weather_data = []
        for day in calendar_days:
            parsed_day = parse_calendar_day(day)
            if parsed_day:
                weather_data.append(parsed_day)
                
        return WeatherResponse(calendar_days=weather_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch weather data: {str(e)}"
        )
