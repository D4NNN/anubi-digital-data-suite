from datetime import datetime
from pprint import pprint
import numpy as np
import plotly.express as px
import pandas as pd



def calc_pnl(prices, trades, capital):
    size = 0
    realized = 0
    equity = capital
    side = ""
    eq_list = []
    realized = 0
    entry_p = 0

    for i, p in prices.iterrows():
        if p['date'] in trades.date.values:

            if entry_p != 0:
                if side == 'LONG':
                    realized += size * (p['close'] - entry_p)
                else:
                    realized += size * (entry_p - p['close'])

                equity = capital + realized

            side = trades.loc[trades['date'] == p['date'], 'type'].values[0]
            entry_p = p['close']
            size = equity / entry_p

        if side == 'LONG':
            equity = capital + realized + size * (p['close'] - entry_p)
        elif side == 'SHORT':
            equity = capital + realized + size * (entry_p - p['close'])

        eq_list.append({'date': p['date'], 'equity': equity})

    return pd.DataFrame(eq_list)


def calc_drawdown(trades):
    current_peak = 0
    result = []
    for i, p in trades.iterrows():

        # find peak
        if p['equity'] > current_peak:
            current_peak = p['equity']

        # calculate drawdown
        if p['equity'] < current_peak:
            dr = ((current_peak - p['equity']) / current_peak) * 100
            result.append({'date': p['date'], 'drawdown': dr})

        # reset peak ?


    return pd.DataFrame(result)


# def calc_pnl_hold(prices, trades, capital):
#     pass


def run_analysis(prices, trades, capital, settings):
    result = {}

    if settings['remove_hours']:
        prices['date'] = prices['date'].apply(lambda x: x.split(",")[0])
        trades['date'] = trades['date'].apply(lambda x: x.split(",")[0])

    if settings['date_filter_active']:
        cutoff = settings['date_filter'].strftime('%d/%m/%Y, %H:%M:%S')

        prices = prices[pd.to_datetime(prices['date']) >= pd.to_datetime(cutoff)]
        trades = trades[pd.to_datetime(trades['date']) >= pd.to_datetime(cutoff)]


    result['asset'] = px.line(prices, x='date', y='close', title="Asset performance")

    ## EQUITY
    trade_df = calc_pnl(prices, trades, capital)
    result['equity'] = px.line(trade_df, x='date', y='equity', title="Total P&L")

    ## VARIOUS
    result['long_n'] = str((trades['type'] == "LONG").sum())
    result['short_n'] = str((trades['type'] == "SHORT").sum())
    result['ratio'] = str((trade_df['equity'].iloc[-1] / capital).round(2) - 1)

    ## DRAWDOWN
    drawdown = calc_drawdown(trade_df)
    result['drawdown'] = px.line(drawdown, x='date', y='drawdown', title="Drawdown")
    result['max_drawdown'] = str(drawdown['drawdown'].max().round(2))
    
    return result



