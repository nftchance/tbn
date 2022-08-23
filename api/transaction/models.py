from django.db import models

class Transaction(models.Model):
    hash = models.CharField(max_length=255, blank=True, null=True)
    type = models.IntegerField(blank=True, null=True)
    access_list = models.CharField(max_length=255, blank=True, null=True)
    block_hash = models.CharField(max_length=255, blank=True, null=True)
    block_number = models.IntegerField(blank=True, null=True)

    from_address = models.CharField(max_length=255, blank=True, null=True)
    to_address = models.CharField(max_length=255, blank=True, null=True)

    chain_id = models.IntegerField(blank=True, null=True)
    confirmations = models.IntegerField(blank=True, null=True)
    creates = models.CharField(max_length=255, blank=True, null=True)
    data = models.CharField(max_length=255, blank=True, null=True)
    gasLimit = models.CharField(max_length=255, blank=True, null=True)
    gasPrice = models.CharField(max_length=255, blank=True, null=True)
    nonce = models.IntegerField(blank=True, null=True)
    timestamp = models.IntegerField(blank=True, null=True)
    transactionIndex = models.IntegerField(blank=True, null=True)
    value = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transaction'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'