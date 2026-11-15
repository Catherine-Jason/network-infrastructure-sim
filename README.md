# Network Infrastructure Simulator

An interactive network lab that runs in the browser. I built it to show how I understand networking and security, and to give students and beginners a hands-on way to see how traffic moves through a network.

**Try it:** https://catherine-jason.github.io/network-infrastructure-sim/

## What you can do

* **Build a network.** Add routers, switches, firewalls, access points, servers, a web server, workstations, laptops, the internet and an IDS sensor. Drag them around and drag from the blue dot to connect them.
* **Learn each device.** Select any device to see what it does, which OSI layer it works at, common ports, what you configure on it, security tips and where you see it in an office.
* **Put devices in zones.** Staff (VLAN 10), Guest (VLAN 20), Servers (VLAN 30) and the DMZ each get their own addresses.
* **Write firewall rules.** From zone, to zone, service, allow or deny. Rules run top to bottom and anything that does not match is denied.
* **Send traffic.** Pick a source, a destination and a service like HTTPS, RDP or SMB. A packet moves across the canvas and the trace explains each hop: the switch forwards inside a VLAN, the router moves it between networks, the firewall checks its rules. The OSI panel shows which layers each device uses.
* **See alerts.** An IDS sensor next to the traffic raises an alert for the SOC when something suspicious is blocked or gets through. This ties into my [SOC Alert Triage](https://catherine-jason.github.io/soc-alert-triage-demo/) game.

## Challenges

1. **Small office:** get two staff computers online.
2. **Put a firewall in front:** make sure nothing from the internet reaches staff directly.
3. **Build a DMZ:** host a public website without exposing the office.
4. **Segment with VLANs:** give guests Wi-Fi that cannot see staff or servers.
5. **Watch the network:** add a sensor so blocked attacks show up as alerts.

Each challenge checks your network and gives hints on anything that is not right yet.

## Built with

HTML, CSS and JavaScript in one file. Your network saves in your browser, and nothing is sent anywhere.

This is a teaching tool, so devices and traffic are simplified. All addresses are fictional.

Built by Catherine Jason · [catherinejason.com](https://www.catherinejason.com)
