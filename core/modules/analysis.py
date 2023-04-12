from datetime import datetime
from pprint import pprint
import numpy as np
import plotly.express as px
import pandas as pd


# def get_percentage(entry, exit_, t):
#     if exit_ > 0:
#         return ((entry - exit_) / exit_) * 100 if t == "SHORT" else ((exit_ - entry) / entry) * 100
#     else:
#         return 0


# def to_pnl(src):
#     return pd.Series([src.iloc[0, 0], get_percentage(src.iloc[0, 1], src.iloc[0, 2], src.iloc[0, 3])])


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


    result['asset'] = px.line(prices, x='date', y='close')

    ## EQUITY
    trade_df = calc_pnl(prices, trades, capital)
    result['equity'] = px.line(trade_df, x='date', y='equity')

    ## DRAWDOWN

    # temp_df = pd.DataFrame(columns=['cumulative', 'highest', 'drawdown'])

    # temp_df['cumulative'] = trade_df.equity.cumsum().round(2)
    # temp_df['highest'] =  temp_df['cumulative'].cummax()
    # temp_df['drawdown'] = temp_df['cumulative'] - temp_df['highest']

    # print(temp_df.to_string())
    
    return result



