from enum import Enum


class Timeframe(Enum):
    H1 = '60'
    H3 = '180'
    H4 = '240'
    D = '1D'
    W = '1W'


class Mode(Enum):
    backtesting = 'normal'
    watcher = 'replay'


class Indicator(Enum):
    ss = 'sharp_shooter'
    ms = 'market_spotter'


class Exchanges(Enum):
    bybit = 'BYBIT'
    bitfinex = 'BITFINEX'


class SignalMode(Enum):
    bit = 'bit'
    value = 'value'


class DateMode(Enum):
    hours = 'h'
    days = 'd'


class SessionMode(Enum):
    CHART = 'cs_'
    QUOTE = 'qs_'


class MsgType(Enum):
    AUTH = 'set_auth_token'
    CHART_SESSION = 'chart_create_session'
    QUOTE_SESSION = 'quote_create_session'
    SET_FIELDS = 'quote_set_fields'
    ADD_SYMBOLS = 'quote_add_symbols'
    FAST_SYMBOLS = 'quote_fast_symbols'
    CREATE_SERIES = 'create_series'
    RESOLVE_SYMBOL = 'resolve_symbol'
    SWITCH_TZ = 'switch_timezone'
    SET_LOCALE = 'set_locale'
