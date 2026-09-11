window.EXPERIMENTAL_PORTABLE_TRAFFIC_TEMPLATE = `| tstats summariesonly=t count
    min(_time) as first_seen
    max(_time) as last_seen
    values(All_Traffic.dest_port) as dest_port
    values(All_Traffic.action) as action
    values(All_Traffic.app) as app
    values(All_Traffic.rule) as rule
    values(sourcetype) as sourcetype
    from datamodel=Network_Traffic.All_Traffic
    where
    (
        All_Traffic.src IN ({{IOC_LIST}})
        OR All_Traffic.dest IN ({{IOC_LIST}})
    )
    {{TIME_RANGE}}
    by All_Traffic.src All_Traffic.dest
| convert ctime(first_seen) ctime(last_seen)
| rename All_Traffic.src as src All_Traffic.dest as dest
| sort - count`;

window.EXPERIMENTAL_COMPAT_TRAFFIC_TEMPLATE = `| tstats summariesonly=f count
    min(_time) as first_seen
    max(_time) as last_seen
    values(All_Traffic.dest_port) as dest_port
    values(All_Traffic.action) as action
    values(All_Traffic.app) as app
    values(All_Traffic.rule) as rule
    values(sourcetype) as sourcetype
    from datamodel=Network_Traffic.All_Traffic
    where
    (
        All_Traffic.src IN ({{IOC_LIST}})
        OR All_Traffic.dest IN ({{IOC_LIST}})
    )
    {{TIME_RANGE}}
    by All_Traffic.src All_Traffic.dest
| convert ctime(first_seen) ctime(last_seen)
| rename All_Traffic.src as src All_Traffic.dest as dest
| sort - count`;

window.EXPERIMENTAL_RAW_TRAFFIC_TEMPLATE = `index=* {{TIME_RANGE}}
(
    src IN ({{QUOTED_IOC_LIST}})
    OR dest IN ({{QUOTED_IOC_LIST}})
    OR src_ip IN ({{QUOTED_IOC_LIST}})
    OR dest_ip IN ({{QUOTED_IOC_LIST}})
    OR source_ip IN ({{QUOTED_IOC_LIST}})
    OR destination_ip IN ({{QUOTED_IOC_LIST}})
)
| eval src=coalesce(src, src_ip, source_ip, client_ip)
| eval dest=coalesce(dest, dest_ip, destination_ip, server_ip)
| stats count min(_time) as first_seen max(_time) as last_seen values(dest_port) as dest_port values(action) as action values(app) as app values(rule) as rule values(sourcetype) as sourcetype by src dest
| convert ctime(first_seen) ctime(last_seen)
| sort - count`;
