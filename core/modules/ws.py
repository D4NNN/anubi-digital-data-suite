import json
import os
import requests
import re
import logging
from websocket import create_connection
from core.classes import MsgType, SessionMode
from core.utils import prepend_headers, construct_message, get_session_string, decode_msg

class WebsocketScraper:
    
    def __init__(self, usr, pwd, premium, asset, cex, tf, candles=10000, keep_alive=False) -> None:
        self.usr = usr
        self.pwd = pwd
        self.premium = premium
        self.asset = asset
        self.cex = cex
        self.tf = tf
        self.symbol = cex + ":" + asset
        self.candles = candles
        self.keep_alive = keep_alive


    def __init_headers(self):
        return json.dumps({
            # 'Connection': 'upgrade',
            # 'Host': 'data.tradingview.com',
            'Origin': 'https://data.tradingview.com'
            # 'Cache-Control': 'no-cache',
            # 'Upgrade': 'websocket',
            # 'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
            # 'Sec-WebSocket-Key': '2C08Ri6FwFQw2p4198F/TA==',
            # 'Sec-WebSocket-Version': '13',
            # 'Pragma': 'no-cache',
            # 'Upgrade': 'websocket'
        })


    def __create_message(self, msg_type, content):
        return prepend_headers(construct_message(msg_type, content))


    def __send_message(self, ws, msg_type, content):
        ws.send(self.__create_message(msg_type, content))


    def __get_auth_token(self):
        sign_in_url = 'https://www.tradingview.com/accounts/signin/'
        data = {"username": self.usr, "password": self.pwd, "remember": "off"}
        headers = {
            'Referer': 'https://www.tradingview.com'
        }
        response = requests.post(url=sign_in_url, data=data, headers=headers)
        #TO-DO: captcha EXCEPTION
        print(response.json())
        return response.json()['user']['auth_token']


    def __connect_ws(self):
        headers = self.__init_headers()
        ws_link = 'wss://prodata.tradingview.com/socket.io/websocket' if self.premium else 'wss://data.tradingview.com/socket.io/websocket'
        return create_connection(ws_link, headers=headers)


    def __login(self, ws):
        self.__send_message(ws, MsgType.AUTH, [self.__get_auth_token()])

    
    def __init_session(self, ws):
        q_session = get_session_string(SessionMode.QUOTE)
        c_session = get_session_string(SessionMode.CHART)

        self.__send_message(ws, MsgType.SET_LOCALE, ["it", "IT"])
        self.__send_message(ws, MsgType.CHART_SESSION, [c_session, ""])
        self.__send_message(ws, MsgType.SWITCH_TZ, [c_session, "Etc/UTC"])
        self.__send_message(ws, MsgType.QUOTE_SESSION, [q_session])

        self.__send_message(ws, MsgType.SET_FIELDS,
                    [q_session, "ch", "chp", "current_session", "description", "local_description", "language", "exchange",
                    "fractional", "is_tradable", "lp", "lp_time", "minmov", "minmove2", "original_name", "pricescale",
                    "pro_name", "short_name", "type", "update_mode", "volume", "currency_code", "rchp", "rtc"])
        # __send_message(ws, MsgType.ADD_SYMBOLS, [q_session, "BINANCE:BTCUSDT", {"flags": ['force_permission']}])
        self.__send_message(ws, MsgType.FAST_SYMBOLS, [q_session, self.symbol])
        self.__send_message(ws, MsgType.RESOLVE_SYMBOL, [c_session, "sds_sym_1", "={\"adjustment\":\"splits\","
                                                                        "\"currency-id\":\"USD\","
                                                                        "\"session\":\"extended\","
                                                                        "\"symbol\":\"" + self.symbol + "\"}"])
        self.__send_message(ws, MsgType.CREATE_SERIES, [c_session, "sds_1", "s1", "sds_sym_1", self.tf, self.candles])


    def run(self):

        logging.info("Connecting Websocket")
        ws = self.__connect_ws()

        logging.info("Logging in")
        self.__login(ws)

        logging.info("Setting up session")
        self.__init_session(ws)

        logging.info("Receiving...")
    
        while True:
            try:
                res = ws.recv()
                # Pattern signals a handshake request to keep the connection alive
                if self.keep_alive and re.match("~m~\\d+~m~~h~\\d+$", res):
                    ws.recv()
                    ws.send(res)
                    print("\n\n-------------------------" + str(res) + "\n\n")
                msgs = decode_msg(res)
                logging.info(res)
                # This may appear dumb but TV returns all the past data in the first message,
                # the following messages are price updates and stuff I have yet to figure out
                if not msgs.empty:
                    logging.info("Prices obtained")
                    if not self.keep_alive:
                        logging.info("All done!")
                        ws.close()
                        return msgs
            except Exception as e:
                print(e)
                break
