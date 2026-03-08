window.DNS_TEMPLATE = `| tstats \`summariesonly\` count earliest(_time) as firstSeen latest(_time) as lastSeen values(sourcetype) as sourcetype, values(DNS.src_category) as src_category values(DNS.answer) as answer, values(DNS.reply_code) as reply_code, values(DNS.dest) as dest values(DNS.record_type) as record_type values(DNS.dest_category) as dest_category from datamodel=Network_Resolution.DNS where {{TIME_RANGE}} DNS.query IN ({{IOC_LIST}}) by DNS.query DNS.src
| convert ctime(*Seen)
| \`drop_dm_object_name(DNS)\``;
