namespace Domain.Entities;

public enum PaymentType
{
    Cash,
    CreditCard,
    BankTransfer
}

public enum PaymentStatus
{
    Paid,
    Pending,
    Failed
}

public class Payment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentType PaymentType { get; set; }
    public PaymentStatus Status { get; set; }
    // Navigation properties
    public Student Student { get; set; } = null!;
} 