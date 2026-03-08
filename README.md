# Splunk IOC Workbench

A lightweight analyst tool that converts IOC lists into Splunk SPL searches.

## Features

- Automatic IOC type detection (IP vs domain)
- Generates searches for:
  - Network Traffic
  - DNS Resolution
  - Web Proxy
- GUI interface for quick IOC hunting workflows

## Usage

Run:
python spl_ioc_workbench.py


Paste IOCs and click **Generate Searches**.

## Example IOC Input
8.8.8.8

badguy.foo

michalsoftwin.net


## Output

Automatically generates SPL searches for Splunk datamodels:

- Network_Traffic
- Network_Resolution.DNS
- Web
