from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import json
from typing import List, Optional
from datetime import datetime

app = FastAPI()

class WeatherData(BaseModel):
    date: str
    high: float
    low: float
    precipitation: float
    condition: str
    type: str  # 'history', 'forecast' or 'almanac'

class HourlyData(BaseModel):
    time: str
    temperature: float
    condition: str
    precipitation_chance: float

def parse_calendar_day(day_element) -> WeatherData:
    date = day_element.select_one(".date").text.strip()
    
    # Get temperature values
    temp_div = day_element.select_one(".temperature")
    high = float(temp_div.select_one(".hi").text.replace("°", ""))
    low = float(temp_div.select_one(".low").text.replace("°", ""))
    
    # Get precipitation
    precip_element = day_element.select_one(".wu-value.wu-value-to")
    precipitation = float(precip_element.text) if precip_element else 0
    
    # Get condition phrase
    phrase_element = day_element.select_one(".phrase")
    condition = phrase_element.text if phrase_element else "N/A"
    
    # Determine type based on class
    type = "forecast"
    if "history" in day_element["class"]:
        type = "history"
    elif "almanac" in day_element["class"]:
        type = "almanac"
    
    return WeatherData(
        date=date,
        high=high,
        low=low,
        precipitation=precipitation,
        condition=condition,
        type=type
    )

@app.get("/api/weather/calendar", response_model=List[WeatherData])
async def get_calendar_weather():
    url = "https://www.wunderground.com/calendar/ca/winnipeg"
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        calendar_days = soup.select("li.calendar-day")
        weather_data = []
        
        for day in calendar_days:
            try:
                weather_data.append(parse_calendar_day(day))
            except Exception as e:
                continue
                
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch calendar data: {str(e)}")

@app.get("/api/weather/hourly", response_model=List[HourlyData])
async def get_hourly_weather():
    url = "https://www.wunderground.com/hourly/ca/winnipeg"
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Note: Since the hourly data is loaded dynamically with JavaScript,
        # we would need to use something like Selenium to get the actual data.
        # This is a placeholder that shows the structure:
        
        return [
            HourlyData(
                time="12:00 PM",
                temperature=20.0,
                condition="Partly Cloudy",
                precipitation_chance=10.0
            )
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch hourly data: {str(e)}")