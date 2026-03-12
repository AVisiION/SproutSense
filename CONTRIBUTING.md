## 🐛 Troubleshooting

### ESP32-CAM Issues

**Camera Init Failed**
- Check board selection: Must be "ESP32 Wrover Module"
- Verify partition scheme: "Huge APP (3MB No OTA)"
- Ensure sufficient power supply (5V, 2A recommended)
- Try different USB cable/port

**Image Upload Fails**
- Check WiFi connection strength
- Verify backend URL is correct
- Check MongoDB connection
- Review Serial Monitor for error codes

**Poor Image Quality**
- Adjust JPEG quality in camera config
- Improve lighting conditions
- Check camera lens for dust/smudges
- Modify sensor settings in `initCamera()`

### ESP32 Sensor Hub Issues

**Sensors Not Reading**
- Verify wiring connections
- Check power supply (5V, 2A minimum)
- Test sensors individually
- Review pin mappings in code

**WiFi Won't Connect**
- Verify SSID/password (case-sensitive)
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router
- Check for special characters in password

**Backend API Errors**
- Verify backend is running (`npm run dev`)
- Check MongoDB connection
- Verify API endpoint URLs
- Check firewall/network settings

### General Issues

**For detailed troubleshooting:** See [DUAL_ESP32_QUICKSTART.md](docs/DUAL_ESP32_QUICKSTART.md#troubleshooting-quick-fixes)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues
1. Check existing issues first
2. Include detailed description
3. Provide error messages and logs
4. Mention hardware/software versions

### Submitting Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Documentation Improvements
- Fix typos or unclear explanations
- Add examples or use cases
- Translate to other languages
- Create video tutorials

### Code Contributions
- Add new sensors support
- Improve ML models
- Enhance UI/UX
- Optimize performance
- Add new features

---

## 📜 License

This project is open-source. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ESP32 Community** - Arduino core and libraries
- **Blynk** - IoT platform for mobile control
- **Edge Impulse** - Machine learning for embedded devices
- **Google Gemini** - AI assistant integration
- **MongoDB** - Database solution
- **React/Vite** - Frontend framework and tooling

---

## 📮 Contact & Support

- **Repository**: [github.com/AV-iot-ai/SproutSense](https://github.com/AV-iot-ai/SproutSense)
- **Issues**: [GitHub Issues](https://github.com/AV-iot-ai/SproutSense/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AV-iot-ai/SproutSense/discussions)

---

## 🗺️ Roadmap

### v2.1 (Planned)
- [ ] Multiple plant support (multiple devices)
- [ ] Advanced scheduling (sunrise/sunset based)
- [ ] Weather-aware watering
- [ ] Email/SMS notifications
- [ ] Mobile app (React Native)

### v2.2 (Future)
- [ ] Nutrient monitoring (NPK sensors)
- [ ] Multi-camera support
- [ ] Time-lapse video generation
- [ ] Pest detection AI
- [ ] Community plant database

### v3.0 (Long-term)
- [ ] LoRaWAN support for long-range
- [ ] Solar power integration
- [ ] Greenhouse automation
- [ ] Commercial farming features

---

## 📊 Project Stats

- **Lines of Code**: ~8,000+
- **Languages**: C++, JavaScript, Python (training)
- **Architecture**: Dual ESP32 (Sensor Hub + AI Vision)
- **Database Collections**: 5 (sensors, diseases, logs, config, status)
- **API Endpoints**: 20+
- **WebSocket Events**: 8
- **Documentation Pages**: 14

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐ on GitHub!

---

**Built with 💚 by the SproutSense Team**

**Version**: 2.0 (Dual ESP32 Architecture)  
**Last Updated**: March 8, 2026  
**Status**: ✅ Production Ready

---

**Happy Growing! 🌱📸**
