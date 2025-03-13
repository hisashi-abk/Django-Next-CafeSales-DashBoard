from datetime import date, datetime
from typing import Optional, Union, List, Dict, Any
from django.db.models import QuerySet
from django.utils.dateparse import parse_date

class BaseService:
    """
    基本サービスクラス
    共通機能を提供
    """

    @staticmethod
    def parse_date_param(date_param: Optional[Union[str, date]]) -> Optional[date]:
        """
        日付パラメータをdate型に変換する

        Args:
            date_param (str or date, optional): 日付パラメータ

        Returns:
            Optional[date]: date型のパラメータ
        """
        if date_param is None:
            return None

        if isinstance(date_param, date):
            return date_param

        try:
            return parse_date(date_param)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def date_range_to_dict(start_date: date, end_date: date) -> Dict[str, date]:
        """開始日と終了日を辞書形式に変換

        Args:
            start_date (date): 開始日
            end_date (date): 終了日

        Returns:
            Dict[str, date]: 辞書形式を返す
        """
        return {
            'start_date': start_date,
            'end_date': end_date
        }
