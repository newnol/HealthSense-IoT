import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const FeaturesSection = () => {
  const features = [
    {
      icon: "📡",
      title: "Thu thập dữ liệu thời gian thực",
      description: "ESP32 đo và truyền dữ liệu nhịp tim và SpO2 với độ chính xác cao",
      delay: 100
    },
    {
      icon: "🤖",
      title: "Phân tích AI thông minh",
      description: "Xử lý và phân tích dữ liệu sinh lý, phát hiện bất thường trong chỉ số sức khỏe",
      delay: 200
    },
    {
      icon: "💡",
      title: "Lời khuyên cá nhân hóa",
      description: "Đưa ra khuyến nghị lối sống dựa trên dữ liệu và cảnh báo sớm các vấn đề sức khỏe",
      delay: 300
    },
    {
      icon: "📊",
      title: "Trực quan hóa dữ liệu",
      description: "Dashboard theo dõi chỉ số sức khỏe với biểu đồ xu hướng theo thời gian",
      delay: 400
    }
  ]

  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" trigger="onScroll" className={styles.sectionTitle}>
          <h2>Tính năng nổi bật</h2>
          <p className={styles.sectionSubtitle}>Công nghệ tiên tiến cho sức khỏe của bạn</p>
        </AnimatedElement>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <AnimatedElement 
              key={index}
              animation="fadeInUp" 
              delay={feature.delay} 
              trigger="onScroll" 
              className={styles.featureCard}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection