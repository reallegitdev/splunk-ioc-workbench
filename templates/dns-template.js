window.DNS_TEMPLATE = `| tstats summariesonly=t count
    min(_time) as first_seen
    max(_time) as last_seen
    values(DNS.answer) as answer
    values(DNS.reply_code) as reply_code
    values(DNS.record_type) as record_type
    from datamodel=Network_Resolution.DNS
    where
    (
{{IOC_LIST}}
    )
    {{TIME_RANGE}}
    by DNS.query DNS.src DNS.dest
| convert ctime(first_seen) ctime(last_seen)
| rename DNS.query as query DNS.src as src DNS.dest as dest
| sort - count`;
