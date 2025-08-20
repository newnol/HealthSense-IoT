import AnimatedElement from '../AnimatedElement'
import styles from '../../styles/components/landing.module.css'

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "HealthSense đã giúp tôi theo dõi sức khỏe một cách chủ động. Các cảnh báo AI rất chính xác và hữu ích.",
      author: "BS. Nguyễn Văn A",
      role: "Bác sĩ tim mạch - BV Chợ Rẫy",
      avatar: "👨‍⚕️",
      delay: 100
    },
    {
      quote: "Giao diện đẹp, dễ sử dụng. Tôi có thể theo dõi sức khỏe mọi lúc mọi nơi. Rất recommend!",
      author: "Chị Trần Thị B",
      role: "Giám đốc Marketing",
      avatar: "👩‍💼",
      delay: 200
    },
    {
      quote: "Công nghệ IoT tuyệt vời! Đã phát hiện sớm được vấn đề sức khỏe của tôi nhờ hệ thống cảnh báo thông minh.",
      author: "Anh Lê Văn C",
      role: "Kỹ sư phần mềm",
      avatar: "👨‍💻",
      delay: 300
    }
  ]

  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <AnimatedElement animation="fadeInUp" trigger="onScroll" className={styles.sectionTitle}>
          <h2>Người dùng nói gì về chúng tôi</h2>
          <p className={styles.sectionSubtitle}>Hàng ngàn người đã tin tưởng HealthSense</p>
        </AnimatedElement>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <AnimatedElement 
              key={index}
              animation="fadeInUp" 
              delay={testimonial.delay} 
              trigger="onScroll" 
              className={styles.testimonialCard}
            >
              <div className={styles.testimonialContent}>
                <div className={styles.quoteIcon}>"</div>
                <p>"{testimonial.quote}"</p>
              </div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>{testimonial.avatar}</div>
                <div className={styles.authorInfo}>
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
              <div className={styles.rating}>
                ⭐⭐⭐⭐⭐
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection