import re
import datetime
import pandas as pd
from datetime import datetime
import random
import string
import json
from core.classes import *
from PIL import Image


def extract_ohlc(prices):
    extracted = re.findall('(?<=[a-zA-Z])(\\d+[.]\\d{2})', prices[1].text)
    if extracted:
        return {
            'open': extracted[0],
            'high': extracted[1],
            'low': extracted[2],
            'close': extracted[3]
        }


def extract_date(date, mode):
    time_frm = "%d/%m/%Y, %H:%M:%S" if mode == DateMode.hours else '%m/%d/%Y'
    return datetime.fromtimestamp(float(date) / 1000.0).strftime(time_frm)


def to_signal(bit):
    return False if bit == "∅" else True if float(bit) > 0 else False


def extract_market_spotter(data):
    extracted = data.text.split("\n")
    return {
        'buy': to_signal(extracted[0]),
        'sell': to_signal(extracted[1]),
    }


def extract_sharp_shooter(data):
    extracted = data.text.split("\n")
    return {
        'buy': to_signal(extracted[9]),
        'sell': to_signal(extracted[10])
        # 'pending_buy': to_signal(extracted[11]),
        # 'pending_sell': to_signal(extracted[12])
    }

def extract_custom_indicator(data, buy_pos, sell_pos):
    extracted = data.text.split("\n")
    return {
        'buy': to_signal(extracted[buy_pos]),
        'sell': to_signal(extracted[sell_pos])
        # 'pending_buy': to_signal(extracted[11]),
        # 'pending_sell': to_signal(extracted[12])
    }


def export_trades(data):
    result = []
    for i in data:
        if i['indicator']['buy'] or i['indicator']['sell']:
            result.append({
                # 'open': i['price']['open'],
                # 'close': i['price']['close'],
                'type': 'LONG' if i['indicator']['buy'] else 'SHORT',
                'date': i['date']
            })
    result.reverse()
    return pd.DataFrame(result)
    # pd.DataFrame(result).to_csv('./extracted/' + ticker + '_' + exchange + '_' + timeframe.name + '.csv', sep=",")


def decode_msg(msg):
    #TO-DO: "invalid symbol" EXCEPTION
    msgs = []
    code = re.finditer('(i\":)(\d+)(,\"v\":)(\[(.*?)+])', msg)
    if code:
        for i in code:
            data = i.group(4)[1:-1].split(",")
            timestamp = int(data[0].split(".")[0])
            msgs.append({
                'date':  str(datetime.fromtimestamp(timestamp).strftime("%d/%m/%Y, %H:%M:%S")),
                'open': data[1],
                'high': data[2],
                'low': data[3],
                'close': data[4],
                # 'volume': data[5]
            })
    return pd.DataFrame(msgs)


def get_session_string(mode):
    letters = string.ascii_lowercase
    return mode.value + ''.join(random.choice(letters) for _ in range(12))


def prepend_headers(content):
    return "~m~" + str(len(content)) + "~m~" + content


def construct_message(msg_type, content):
    return json.dumps({
        "m": msg_type.value,
        "p": content
    }, separators=(',', ':'))


def merge_and_extract(prices, indicator, ticker, exchange, timeframe):
    merged = []
    for i in indicator:
        if i['indicator']['buy'] or i['indicator']['sell']:
            for j in prices:
                if i['date'] == j['date']:
                    merged.append({
                        'open': j['open'],
                        'close': j['close'],
                        'type': 'LONG' if i['indicator']['buy'] else 'SHORT',
                        'date': i['date']
                    })
    merged.reverse()
    pd.DataFrame(merged)\
        .to_csv('./extracted/' + 'TRADES_' + ticker + '_' + exchange + '_' + timeframe.name + '.csv', sep=",")


def extract_prices(prices, ticker, exchange, timeframe):
    merged = []
    for i in prices:
        merged.append({
            'open': i['open'],
            'close': i['close'],
            'date': i['date'],
        })
    merged.reverse()
    pd.DataFrame(merged)\
        .to_csv('./extracted/' + 'PRICES_' + ticker + '_' + exchange + '_' + timeframe.name + '.csv', sep=",")
    

def combine_images(columns, space, images):
    rows = len(images) // columns
    if len(images) % columns:
        rows += 1
    width_max = max([Image.open(image).width for image in images])
    height_max = max([Image.open(image).height for image in images])
    background_width = width_max*columns + (space*columns)-space
    background_height = height_max*rows + (space*rows)-space
    background = Image.new('RGBA', (background_width, background_height), (255, 255, 255, 255))
    x = 0
    y = 0
    for i, image in enumerate(images):
        img = Image.open(image)
        x_offset = int((width_max-img.width)/2)
        y_offset = int((height_max-img.height)/2)
        background.paste(img, (x+x_offset, y+y_offset))
        x += width_max + space
        if (i+1) % columns == 0:
            y += height_max + space
            x = 0
    background.save('image.png')
