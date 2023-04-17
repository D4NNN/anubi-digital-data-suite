from datetime import datetime
from pprint import pprint
import numpy as np
import plotly.express as px
import pandas as pd




def calc_pnl(prices, trades, capital, transposed, tr_amount):
    equity = capital
    eq_list = []
    price_col = 'open' if transposed else 'close'
    convert = lambda date: pd.to_datetime(date , format="%d/%m/%Y, %H:%M:%S", dayfirst=True, exact=True)

    trades['date'] = trades['date'].apply(lambda x: convert(x) + pd.DateOffset(hours=tr_amount))
    prices['date'] = prices['date'].apply(convert)
    merged = pd.merge(prices,trades,how="left",on=["date"]).ffill()

    first_trade = merged.type.first_valid_index()

    for i, p in merged.iterrows():
        
        if p['type'] == 'LONG' and not i == first_trade:
            equity = equity * (p[price_col] / merged.iloc[i-1, merged.columns.get_loc(price_col)])
        elif p['type'] == 'SHORT' and not i == first_trade:
            equity = equity * (merged.iloc[i-1, merged.columns.get_loc(price_col)] / p[price_col])
        
        eq_list.append({'date': p['date'], 'equity': equity, 'open':p['open'], 'close':p['close'], 'type': p['type']})
    # print(pd.DataFrame(eq_list)[90:200].to_string())
    pd.DataFrame(eq_list).to_csv("avax_daily.csv")
    return pd.DataFrame(eq_list)


def calc_pnl_hold(prices, trades, capital, transposed, tr_amount):
    equity = capital
    eq_list = []
    price_col = 'open' if transposed else 'close'
    convert = lambda date: pd.to_datetime(date , format="%d/%m/%Y, %H:%M:%S", dayfirst=True, exact=True)

    trades['date'] = trades['date'].apply(lambda x: convert(x) + pd.DateOffset(hours=tr_amount))
    prices['date'] = prices['date'].apply(convert)
    merged = pd.merge(prices,trades,how="left",on=["date"]).ffill()

    first_trade = merged.type.first_valid_index()

    for i, p in merged.iterrows():
        if p['type'] == 'LONG' and not i == first_trade:
            equity = equity * (p[price_col] / merged.iloc[i-1, merged.columns.get_loc(price_col)])
        eq_list.append({'date': p['date'], 'equity': equity, 'open':p['open'], 'close':p['close'], 'type': p['type']})

    return pd.DataFrame(eq_list)


def calc_drawdown(trades):
    current_peak = 0
    result = []

    for _, p in trades.iterrows():
        # find peak
        if p['equity'] > current_peak:
            current_peak = p['equity']
        # calculate drawdown
        if p['equity'] < current_peak:
            dr = ((current_peak - p['equity']) / current_peak) * 100
            result.append({'date': p['date'], 'drawdown': dr})
    return pd.DataFrame(result)


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
    trade_df = calc_pnl(prices, trades, capital, settings['transpose_date_active'], settings['transpose_date'])
    hold_df = calc_pnl_hold(prices, trades, capital, settings['transpose_date_active'], settings['transpose_date'])

    result['equity'] = px.line(trade_df, x='date', y='equity', title="Long/Short P&L")
    result['hold'] = px.line(hold_df, x='date', y='equity', title="Hold P&L")

    # result['eq_combo'] = result['equity'].add_scatter(result['hold'])

    ## VARIOUS
    result['long_n'] = str((trades['type'] == "LONG").sum())
    result['short_n'] = str((trades['type'] == "SHORT").sum())
    result['ratio'] = str(((trade_df['equity'].iloc[-1] / capital)- 1).round(2))

    result['ratio_hold'] = str(((hold_df['equity'].iloc[-1] / capital) -1).round(2))

    ## DRAWDOWN
    drawdown = calc_drawdown(trade_df)
    drawdown_hold = calc_drawdown(hold_df)

    result['drawdown'] = px.line(drawdown, x='date', y='drawdown', title="Drawdown")
    result['max_drawdown'] = str(drawdown['drawdown'].max().round(2))

    result['drawdown_hold'] = px.line(drawdown_hold, x='date', y='drawdown', title="Drawdown (Hold)")
    result['max_drawdown_hold'] = str(drawdown_hold['drawdown'].max().round(2))

    # result['drawdown_combo'] = result['drawdown'].add_scatter(result['drawdown_hold'])
    
    return result



