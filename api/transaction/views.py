from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Transaction
from .serializer import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    filter_fields = ('hash', 'type', 'access_list', 'block_hash', 'block_number', 'from_address', 'to_address', 'chain_id', 'confirmations',
                     'creates', 'data', 'gasLimit', 'gasPrice', 'nonce', 'timestamp', 'transactionIndex', 'value', 'created_at', 'updated_at')

    ordering_fields = ('hash', 'type', 'access_list', 'block_hash', 'block_number', 'from_address',
                       'to_address', 'chain_id', 'confirmations', 'creates', 'data', 'gasLimit', 'gasPrice', 'nonce')

    @action(detail=False, methods=['get'])
    def address(self, request, *args, **kwargs):
        address = request.query_params.get('address')

        queryset = Transaction.objects.filter(
            from_address=address) | Transaction.objects.filter(to_address=address)

        serializer = TransactionSerializer(queryset, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk(self, request, *args, **kwargs):
        # get the transaction history from the request body and create the transaction in the database if one doesn't exist yet based on the transaction hash otherwise, update the transaction
        # use request data as transactions array
        transactions = request.data.get('history')

        for transaction in transactions:
            transaction_hash = transaction.get('hash')

            transaction['access_list'] = transaction.get('accessList')
            transaction['block_hash'] = transaction.get('blockHash')
            transaction['block_number'] = transaction.get('blockNumber')
            transaction['from_address'] = transaction.get('from')
            transaction['to_address'] = transaction.get('to')
            transaction['chain_id'] = transaction.get('chainId')

            transaction.pop('accessList')
            transaction.pop('blockHash')
            transaction.pop('blockNumber')
            transaction.pop('from')
            transaction.pop('to')
            transaction.pop('chainId')

            try:
                Transaction.objects.get(hash=transaction_hash)
            except Transaction.DoesNotExist:
                Transaction.objects.create(**transaction)
            else:
                Transaction.objects.filter(
                    hash=transaction_hash).update(**transaction)

        return Response(status=200)
