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

window.EXPERIMENTAL_FORTIGATE_DOMAIN_TEMPLATE = `index=netfw sourcetype=fortigate_utm {{TIME_RANGE}}
(
{{DOMAIN_CLAUSES}}
)
| stats
    count
    min(_time) as first_seen
    max(_time) as last_seen
    values(dest) as dest
    values(dest_port) as dest_port
    values(action) as action
    values(app) as app
    by src domain
| convert ctime(first_seen) ctime(last_seen)
| sort - count`;


window.EXPERIMENTAL_CROWDSTRIKE_HASH_TEMPLATE = `index=crowdstrike sourcetype="CrowdStrike:Event:Streams:JSON" {{TIME_RANGE}}
(
{{HASH_CLAUSES}}
)
| eval matched_hash=coalesce(
    'event.SHA256String',
    'event.SHA1String',
    'event.MD5String',
    file_hash,
    'event.IOCValue',
    'event.QuarantineFiles{}.SHA256HashData'
)
| eval matched_file=coalesce(
    'event.FileName',
    file_name,
    process_name,
    original_file_name,
    'event.AssociatedFile',
    'event.QuarantineFiles{}.ImageFileName'
)
| eval matched_path=coalesce(
    'event.FilePath',
    file_path,
    process_path
)
| table _time
    event.Hostname
    event.UserName
    matched_file
    matched_path
    matched_hash
    event.CommandLine
    event.ParentImageFileName
    event.Name
    event.Description
    event.SeverityName
    action
| sort 0 - _time`;
