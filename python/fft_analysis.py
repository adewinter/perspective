import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
from scipy import fftpack

from scipy.signal import butter, filtfilt  # Filter requirements.


def butter_lowpass_filter(data, cutoff, fs, order):
    # fs = 50.0       # sample rate, Hz
    # cutoff = peak_frequency[0]     # desired cutoff frequency of the filter, Hz ,      slightly higher than actual 2 Hz
    # order = 2       # sin wave can be approx represented as quadratic
    # print("Cutoff freq " + str(cutoff))
    nyq = 0.5 * fs  # Nyquist Frequency
    normal_cutoff = cutoff / nyq
    # Get the filter coefficients
    b, a = butter(order, normal_cutoff, btype="low", analog=False)
    y = filtfilt(b, a, data)
    return y


def calc_filtered_and_plot(data, sample_rate):
    sample_frequency = 1 / sample_rate
    cutoff_frequency = 0.01
    order = 1
    filtered_data = butter_lowpass_filter(
        data, cutoff_frequency, sample_frequency, order
    )
    num_samples = len(data)
    seconds = num_samples * sample_rate
    time = np.linspace(0, seconds, num_samples, endpoint=True)
    plt.subplot(233)
    plt.plot(time, data)
    plt.xlabel("Time (s)")
    plt.ylabel("X Position Coordinate (cm)")
    plt.title("FILTERED DATA")
    return filtered_data


def calc_filtered_fft(data, sample_rate):
    return calc_fft(data, sample_rate)


def render_fft_signal(x_axis, y_axis, subplot):
    plt.subplot(subplot)  # Create a figure containing a single axes.
    plt.plot(x_axis, y_axis)
    plt.ylabel("Amplitude")
    plt.xlabel("Frequency (Hz)")


def render_data(data, sample_rate):
    num_samples = len(data)
    seconds = num_samples * sample_rate
    time = np.linspace(0, seconds, num_samples, endpoint=True)
    plt.subplot(231)
    plt.plot(time, data)
    plt.xlabel("Time (s)")
    plt.ylabel("X Position Coordinate (cm)")


def calc_fft(samples, sample_rate):
    samples = np.array(samples)
    # print(f"Samples: {samples}")
    num_samples = len(samples)
    total_time = samples * sample_rate
    result_fft = fftpack.fft(samples)
    result_amp = 2 / num_samples * np.abs(result_fft)
    result_freq = np.abs(fftpack.fftfreq(num_samples, sample_rate))

    return result_freq, result_amp


def main():
    data = None
    sample_rate = 1 / 30.0
    with open("data.txt", "r") as file:
        data = [float(num) for num in file.readlines()][-30:]

    render_data(data, sample_rate)

    result_freq, result_amp = calc_fft(data, sample_rate)
    render_fft_signal(result_freq[1:], result_amp[1:], 232)

    filtered_data = calc_filtered_and_plot(data, sample_rate)
    result_freq, result_amp = calc_filtered_fft(filtered_data, sample_rate)
    render_fft_signal(result_freq[1:], result_amp[1:], 234)
    plt.show()


if __name__ == "__main__":
    main()
