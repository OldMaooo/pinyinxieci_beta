# Test both ports
echo "Testing port 5175..."
curl -s -m 3 http://localhost:5175 > /dev/null && echo "✅ 5175 works" || echo "❌ 5175 failed"
echo ""
echo "Testing port 3009..."
curl -s -m 3 http://localhost:3009 > /dev/null && echo "✅ 3009 works" || echo "❌ 3009 failed"
