window.WEB_TEMPLATE = `| tstats summariesonly=t count
    min(_time) as first_seen
    max(_time) as last_seen
    from datamodel=Web.Web
    where
    (
{{IOC_LIST}}
    )
    {{TIME_RANGE}}
    by Web.url Web.src Web.dest
| convert ctime(first_seen) ctime(last_seen)
| rename Web.url as url Web.src as src Web.dest as dest
| sort - count`;
